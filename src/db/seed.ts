import 'dotenv/config';
import { and, eq, count } from 'drizzle-orm';
import { db } from './index';
import { clients, leads, projects, users, workspaces } from './schema';
import { saveClient, saveLead, saveProject } from '@/lib/crm-mutations';
import type { LeadStatus, ProjectStatus } from '@/lib/domain';

async function main() {
  const email = process.env.SEED_ACCOUNT_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error('Set SEED_ACCOUNT_EMAIL to an existing account before seeding.');
  const owner = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
  if (!owner) throw new Error('Register the account before seeding its workspace.');
  const workspace = db.select().from(workspaces).where(eq(workspaces.ownerId, owner.id)).orderBy(workspaces.createdAt).get();
  if (!workspace) throw new Error('Create a workspace before seeding.');

  const records = db.select({
    clients: count(clients.id),
    leads: count(leads.id),
    projects: count(projects.id),
  }).from(workspaces)
    .leftJoin(clients, eq(clients.workspaceId, workspaces.id))
    .leftJoin(leads, eq(leads.workspaceId, workspaces.id))
    .leftJoin(projects, eq(projects.workspaceId, workspaces.id))
    .where(and(eq(workspaces.id, workspace.id), eq(workspaces.ownerId, owner.id)))
    .get();
  if (records && records.clients + records.leads + records.projects > 0) {
    throw new Error('The selected workspace already has CRM records; seed an empty workspace only.');
  }

  const clientData = [
    { name: 'Maya Chen', email: 'maya@northstar.studio', phone: '+1 415 555 0136', company: 'Northstar Studio', notes: 'Brand refresh and launch support.' },
    { name: 'Jordan Lee', email: 'jordan@fieldwork.co', phone: '+1 503 555 0184', company: 'Fieldwork Co.', notes: 'Quarterly product design engagement.' },
    { name: 'Avery Patel', email: 'avery@oakandember.com', phone: '+1 312 555 0162', company: 'Oak & Ember', notes: 'Prefers email for project updates.' },
  ];
  const savedClients = clientData.map((record) => saveClient(workspace.id, record));
  const futureDate = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  const [northstarId, fieldworkId, oakAndEmberId] = savedClients;
  if (!northstarId || !fieldworkId || !oakAndEmberId) throw new Error('Could not create seed clients.');
  const projectData = [
    { name: 'Website redesign', clientId: northstarId, description: 'A clearer portfolio and inquiry flow.', budget: '8400', deadline: futureDate(12), status: 'Active' as ProjectStatus },
    { name: 'Product onboarding', clientId: fieldworkId, description: 'Improve activation for first-time users.', budget: '12600', deadline: futureDate(24), status: 'Active' as ProjectStatus },
    { name: 'Spring campaign', clientId: oakAndEmberId, description: 'Campaign concept and launch assets.', budget: '5900', deadline: futureDate(-4), status: 'On hold' as ProjectStatus },
  ];
  for (const record of projectData) saveProject(workspace.id, record);

  const leadData = [
    { name: 'Sam Rivera', email: 'sam@brightpath.io', phone: '', company: 'Brightpath', source: 'Referral', status: 'New' as LeadStatus, notes: 'Referred by Maya; needs a first call.' },
    { name: 'Taylor Morgan', email: 'taylor@littleweather.com', phone: '', company: 'Little Weather', source: 'Website', status: 'Contacted' as LeadStatus, notes: 'Sent the initial project overview.' },
    { name: 'Casey Brooks', email: '', phone: '+1 646 555 0117', company: 'Brooks Advisory', source: 'Networking event', status: 'Qualified' as LeadStatus, notes: 'Interested in ongoing design support.' },
    { name: 'Robin Ellis', email: 'robin@harborandpine.com', phone: '', company: 'Harbor & Pine', source: 'LinkedIn', status: 'Negotiation' as LeadStatus, notes: 'Reviewing the proposed project scope.' },
  ];
  for (const record of leadData) saveLead(workspace.id, record);
  console.log(`Added ${clientData.length} clients, ${leadData.length} leads, and ${projectData.length} projects to ${workspace.name}.`);
}

main().catch((error: unknown) => {
  console.error('Seeding failed.', error);
  process.exitCode = 1;
});
