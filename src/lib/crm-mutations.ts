import { randomUUID } from 'node:crypto';
import { and, count, eq } from 'drizzle-orm';
import { db, type AppDatabase } from '@/db';
import { activities, clients, leads, projects } from '@/db/schema';
import type { LeadStatus, ProjectStatus } from './domain';

export type ClientInput = {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

export type LeadInput = ClientInput & {
  source: string;
  status: LeadStatus;
};

export type ProjectInput = {
  name: string;
  clientId: string;
  description: string;
  budget: string;
  deadline: string;
  status: ProjectStatus;
};

type ActivityItem = {
  workspaceId: string;
  kind: 'created' | 'updated' | 'deleted' | 'converted';
  entityName: 'client' | 'lead' | 'project';
  entityId: string;
  summary: string;
  createdAt: string;
};

function addActivity(transaction: Parameters<Parameters<AppDatabase['transaction']>[0]>[0], item: ActivityItem) {
  transaction.insert(activities).values({ id: randomUUID(), ...item }).run();
}

function contactValues(input: ClientInput) {
  const email = input.email.trim();
  return {
    name: input.name,
    email: email || null,
    emailNormalized: email ? email.toLowerCase() : null,
    phone: input.phone || null,
    company: input.company || null,
    notes: input.notes || null,
  };
}

export function saveClient(
  workspaceId: string,
  input: ClientInput,
  clientId?: string,
  database: AppDatabase = db,
): string {
  const id = clientId ?? randomUUID();
  const now = new Date().toISOString();
  const values = contactValues(input);

  database.transaction((transaction) => {
    if (clientId) {
      const updated = transaction
        .update(clients)
        .set({ ...values, updatedAt: now })
        .where(and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId)))
        .run();
      if (!updated.changes) throw new Error('Client not found.');
    } else {
      transaction.insert(clients).values({ id, workspaceId, ...values, createdAt: now, updatedAt: now }).run();
    }
    addActivity(transaction, {
      workspaceId,
      kind: clientId ? 'updated' : 'created',
      entityName: 'client',
      entityId: id,
      summary: `${clientId ? 'Updated' : 'Added'} client ${input.name}`,
      createdAt: now,
    });
  });
  return id;
}

export function deleteClient(workspaceId: string, clientId: string, database: AppDatabase = db) {
  database.transaction((transaction) => {
    const client = transaction
      .select({ name: clients.name })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId)))
      .get();
    if (!client) throw new Error('Client not found.');

    const projectCount = transaction
      .select({ value: count() })
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.clientId, clientId)))
      .get()?.value ?? 0;
    const convertedLeadCount = transaction
      .select({ value: count() })
      .from(leads)
      .where(and(eq(leads.workspaceId, workspaceId), eq(leads.clientId, clientId)))
      .get()?.value ?? 0;
    if (projectCount > 0) throw new Error('Move or delete this client’s projects before deleting the client.');
    if (convertedLeadCount > 0) throw new Error('Delete the converted lead record before deleting this client.');

    transaction.delete(clients).where(and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId))).run();
    addActivity(transaction, {
      workspaceId,
      kind: 'deleted',
      entityName: 'client',
      entityId: clientId,
      summary: `Deleted client ${client.name}`,
      createdAt: new Date().toISOString(),
    });
  });
}

export function saveLead(
  workspaceId: string,
  input: LeadInput,
  leadId?: string,
  database: AppDatabase = db,
): string {
  const id = leadId ?? randomUUID();
  const now = new Date().toISOString();
  const values = {
    ...contactValues(input),
    source: input.source,
    status: input.status,
    updatedAt: now,
  };

  database.transaction((transaction) => {
    if (leadId) {
      const current = transaction
        .select({ status: leads.status })
        .from(leads)
        .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)))
        .get();
      if (!current) throw new Error('Lead not found.');
      if (current.status === 'Converted' || input.status === 'Converted') {
        throw new Error('Use the convert action to turn a lead into a client.');
      }
      transaction.update(leads).set(values).where(eq(leads.id, leadId)).run();
    } else {
      if (input.status === 'Converted') throw new Error('Use the convert action to turn a lead into a client.');
      transaction.insert(leads).values({
        id,
        workspaceId,
        ...values,
        clientId: null,
        createdAt: now,
      }).run();
    }
    addActivity(transaction, {
      workspaceId,
      kind: leadId ? 'updated' : 'created',
      entityName: 'lead',
      entityId: id,
      summary: `${leadId ? 'Updated' : 'Added'} lead ${input.name}`,
      createdAt: now,
    });
  });
  return id;
}

export function convertLead(workspaceId: string, leadId: string, database: AppDatabase = db): string {
  return database.transaction((transaction) => {
    const lead = transaction
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)))
      .get();
    if (!lead) throw new Error('Lead not found.');
    if (lead.status === 'Lost') throw new Error('A lost lead cannot be converted.');
    if (lead.status === 'Converted' && lead.clientId) return lead.clientId;

    const existing = lead.emailNormalized
      ? transaction
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.workspaceId, workspaceId), eq(clients.emailNormalized, lead.emailNormalized)))
          .get()
      : undefined;
    const clientId = existing?.id ?? randomUUID();
    const now = new Date().toISOString();

    if (!existing) {
      transaction.insert(clients).values({
        id: clientId,
        workspaceId,
        name: lead.name,
        email: lead.email,
        emailNormalized: lead.emailNormalized,
        phone: lead.phone,
        company: lead.company,
        notes: lead.notes,
        createdAt: now,
        updatedAt: now,
      }).run();
    }
    transaction.update(leads).set({ status: 'Converted', clientId, updatedAt: now }).where(eq(leads.id, leadId)).run();
    addActivity(transaction, {
      workspaceId,
      kind: 'converted',
      entityName: 'lead',
      entityId: leadId,
      summary: `Converted lead ${lead.name} to a client`,
      createdAt: now,
    });
    return clientId;
  });
}

export function deleteLead(workspaceId: string, leadId: string, database: AppDatabase = db) {
  database.transaction((transaction) => {
    const lead = transaction
      .select({ name: leads.name })
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)))
      .get();
    if (!lead) throw new Error('Lead not found.');
    transaction.delete(leads).where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId))).run();
    addActivity(transaction, {
      workspaceId,
      kind: 'deleted',
      entityName: 'lead',
      entityId: leadId,
      summary: `Deleted lead ${lead.name}`,
      createdAt: new Date().toISOString(),
    });
  });
}

export function saveProject(
  workspaceId: string,
  input: ProjectInput,
  projectId?: string,
  database: AppDatabase = db,
): string {
  const client = database
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, input.clientId), eq(clients.workspaceId, workspaceId)))
    .get();
  if (!client) throw new Error('Choose a client in this workspace.');

  const id = projectId ?? randomUUID();
  const now = new Date().toISOString();
  const budgetCents = input.budget ? Math.round(Number(input.budget) * 100) : null;
  const values = {
    name: input.name,
    clientId: input.clientId,
    description: input.description || null,
    budgetCents,
    deadline: input.deadline || null,
    status: input.status satisfies ProjectStatus,
    updatedAt: now,
  };

  database.transaction((transaction) => {
    if (projectId) {
      const updated = transaction
        .update(projects)
        .set(values)
        .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
        .run();
      if (!updated.changes) throw new Error('Project not found.');
    } else {
      transaction.insert(projects).values({ id, workspaceId, ...values, createdAt: now }).run();
    }
    addActivity(transaction, {
      workspaceId,
      kind: projectId ? 'updated' : 'created',
      entityName: 'project',
      entityId: id,
      summary: `${projectId ? 'Updated' : 'Added'} project ${input.name}`,
      createdAt: now,
    });
  });
  return id;
}

export function deleteProject(workspaceId: string, projectId: string, database: AppDatabase = db) {
  database.transaction((transaction) => {
    const project = transaction
      .select({ name: projects.name })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
      .get();
    if (!project) throw new Error('Project not found.');
    transaction.delete(projects).where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId))).run();
    addActivity(transaction, {
      workspaceId,
      kind: 'deleted',
      entityName: 'project',
      entityId: projectId,
      summary: `Deleted project ${project.name}`,
      createdAt: new Date().toISOString(),
    });
  });
}
