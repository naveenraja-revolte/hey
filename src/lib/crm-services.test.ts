import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { createDatabase, type AppDatabase } from '@/db';
import { clients, leads, workspaces } from '@/db/schema';
import { authenticateAccount, createSession, getAccountForSession, registerAccount, revokeSession } from './auth-service';
import { leadSchema, projectSchema } from './domain';
import { convertLead, deleteClient, deleteProject, saveClient, saveLead, saveProject } from './crm-mutations';
import { getLead, listClients } from './crm-queries';
import { createWorkspace, deleteWorkspaceIfEmpty } from './workspace-service';

const password = 'correct horse battery staple 42';

async function setup() {
  const database = createDatabase(new Database(':memory:'));
  const account = await registerAccount({ name: 'Riley Morgan', email: `riley-${crypto.randomUUID()}@example.com`, password }, database);
  const workspace = database.select().from(workspaces).where(eq(workspaces.ownerId, account.id)).get();
  if (!workspace) throw new Error('Test workspace was not created.');
  return { database, account, workspace };
}

function closeDatabase(database: AppDatabase) {
  database.$client.close();
}

test('registration hashes passwords and sessions expire and revoke', async () => {
  const { database, account } = await setup();
  try {
    assert.equal((await authenticateAccount(account.email.toUpperCase(), password, database))?.id, account.id);
    assert.equal(await authenticateAccount(account.email, 'incorrect password', database), null);

    const now = new Date('2026-04-12T10:00:00.000Z');
    const session = createSession(account.id, database, now);
    assert.equal(getAccountForSession(session.token, database, now)?.id, account.id);
    assert.equal(getAccountForSession(session.token, database, new Date(session.expiresAt)) , null);
    revokeSession(session.token, database);
    assert.equal(getAccountForSession(session.token, database, now), null);
  } finally {
    closeDatabase(database);
  }
});

test('workspace-scoped client and project writes cannot cross boundaries', async () => {
  const { database, account, workspace } = await setup();
  try {
    const otherWorkspaceId = createWorkspace(account.id, 'Separate business', database);
    const clientId = saveClient(workspace.id, {
      name: 'Morgan Ellis', email: 'morgan@example.com', phone: '', company: '', notes: '',
    }, undefined, database);

    assert.equal(listClients(otherWorkspaceId, {}, database).total, 0);
    assert.throws(
      () => saveClient(otherWorkspaceId, {
        name: 'Changed', email: '', phone: '', company: '', notes: '',
      }, clientId, database),
      /Client not found/,
    );
    assert.throws(
      () => saveProject(otherWorkspaceId, {
        name: 'Unauthorized project', clientId, description: '', budget: '', deadline: '', status: 'Planned',
      }, undefined, database),
      /Choose a client in this workspace/,
    );

    const projectId = saveProject(workspace.id, {
      name: 'Discovery', clientId, description: 'Initial scope', budget: '1200.00', deadline: '2026-06-01', status: 'Active',
    }, undefined, database);
    assert.throws(() => deleteClient(workspace.id, clientId, database), /projects before deleting/);
    deleteProject(workspace.id, projectId, database);
    deleteClient(workspace.id, clientId, database);
    assert.equal(listClients(workspace.id, {}, database).total, 0);
  } finally {
    closeDatabase(database);
  }
});

test('lead conversion links normalized duplicate email and stays idempotent', async () => {
  const { database, workspace } = await setup();
  try {
    const existingClientId = saveClient(workspace.id, {
      name: 'Sam Rivera', email: 'sam@example.com', phone: '', company: 'Brightpath', notes: '',
    }, undefined, database);
    const leadId = saveLead(workspace.id, {
      name: 'Sam Rivera', email: 'SAM@EXAMPLE.COM', phone: '', company: 'Brightpath',
      source: 'Referral', status: 'Negotiation', notes: 'Warm introduction',
    }, undefined, database);

    assert.equal(convertLead(workspace.id, leadId, database), existingClientId);
    assert.equal(convertLead(workspace.id, leadId, database), existingClientId);
    assert.equal(listClients(workspace.id, {}, database).total, 1);
    assert.equal(getLead(workspace.id, leadId, database)?.status, 'Converted');
    assert.equal(database.select({ id: clients.id }).from(clients).where(eq(clients.id, existingClientId)).get()?.id, existingClientId);

    const lostLeadId = saveLead(workspace.id, {
      name: 'Lost prospect', email: '', phone: '', company: '', source: 'Event', status: 'Lost', notes: '',
    }, undefined, database);
    assert.throws(() => convertLead(workspace.id, lostLeadId, database), /lost lead cannot be converted/);
    assert.equal(getLead(workspace.id, lostLeadId, database)?.status, 'Lost');
  } finally {
    closeDatabase(database);
  }
});

test('workspace deletion protects existing records and validation rejects invalid dates', async () => {
  const { database, account, workspace } = await setup();
  try {
    const emptyWorkspaceId = createWorkspace(account.id, 'Empty', database);
    assert.equal(deleteWorkspaceIfEmpty(account.id, emptyWorkspaceId, database), 'deleted');

    saveClient(workspace.id, {
      name: 'Ari Chen', email: '', phone: '', company: '', notes: '',
    }, undefined, database);
    assert.equal(deleteWorkspaceIfEmpty(account.id, workspace.id, database), 'contains-records');
    assert.equal(leadSchema.safeParse({
      name: 'Ari', email: '', phone: '', company: '', source: 'Referral', status: 'Converted', notes: '',
    }).success, true);
    assert.equal(projectSchema.safeParse({
      name: 'Broken date', clientId: 'client', description: '', budget: '', deadline: '2026-02-30', status: 'Planned',
    }).success, false);
    assert.equal(database.select({ id: clients.id }).from(clients).where(eq(clients.workspaceId, workspace.id)).all().length, 1);
    assert.equal(database.select({ id: leads.id }).from(leads).where(eq(leads.workspaceId, workspace.id)).all().length, 0);
  } finally {
    closeDatabase(database);
  }
});
