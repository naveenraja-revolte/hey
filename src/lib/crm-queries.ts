import { and, asc, count, desc, eq, ne, or, sql } from 'drizzle-orm';
import type { SQLWrapper } from 'drizzle-orm/sql/sql';
import { db, type AppDatabase } from '@/db';
import { activities, clients, leads, projects } from '@/db/schema';
import { pageSize, upcomingDays } from './domain';

export type ListFilters = {
  q?: string;
  status?: string;
  page?: number;
  sort?: string;
  clientId?: string;
  relation?: string;
  overdue?: boolean;
};

function pageNumber(value?: number): number {
  return Number.isInteger(value) && value && value > 0 ? value : 1;
}

function textSearch(value: string | undefined, columns: SQLWrapper[]) {
  const query = value?.trim();
  return query
    ? or(...columns.map((column) => sql`${column} LIKE ${`%${query}%`}`))
    : undefined;
}

export function listClients(workspaceId: string, filters: ListFilters = {}, database: AppDatabase = db) {
  const search = textSearch(filters.q, [clients.name, clients.company, clients.email]);
  const relationFilter = filters.relation === 'with-projects'
    ? sql`EXISTS (SELECT 1 FROM projects WHERE projects.client_id = ${clients.id})`
    : filters.relation === 'without-projects'
      ? sql`NOT EXISTS (SELECT 1 FROM projects WHERE projects.client_id = ${clients.id})`
      : undefined;
  const where = and(eq(clients.workspaceId, workspaceId), search, relationFilter);
  const page = pageNumber(filters.page);
  const order = filters.sort === 'company'
    ? asc(clients.company)
    : filters.sort === 'name'
      ? asc(clients.name)
      : desc(clients.updatedAt);
  const items = database
    .select()
    .from(clients)
    .where(where)
    .orderBy(order, asc(clients.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();
  const total = database.select({ value: count() }).from(clients).where(where).get()?.value ?? 0;
  return { items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function getClientDetails(workspaceId: string, clientId: string, database: AppDatabase = db) {
  const client = database
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId)))
    .get();
  if (!client) return null;

  const associatedProjects = database
    .select()
    .from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.clientId, clientId)))
    .orderBy(desc(projects.updatedAt))
    .limit(pageSize)
    .all();
  return { client, projects: associatedProjects };
}

export function listLeads(workspaceId: string, filters: ListFilters = {}, database: AppDatabase = db) {
  const search = textSearch(filters.q, [leads.name, leads.company, leads.email]);
  const status = filters.status ? eq(leads.status, filters.status) : undefined;
  const where = and(eq(leads.workspaceId, workspaceId), search, status);
  const page = pageNumber(filters.page);
  const items = database
    .select()
    .from(leads)
    .where(where)
    .orderBy(filters.sort === 'name' ? asc(leads.name) : desc(leads.updatedAt), asc(leads.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();
  const total = database.select({ value: count() }).from(leads).where(where).get()?.value ?? 0;
  return { items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function listProjects(workspaceId: string, filters: ListFilters = {}, database: AppDatabase = db) {
  const search = textSearch(filters.q, [projects.name, projects.description]);
  const status = filters.status ? eq(projects.status, filters.status) : undefined;
  const client = filters.clientId ? eq(projects.clientId, filters.clientId) : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = filters.overdue
    ? and(
        sql`${projects.deadline} < ${today}`,
        ne(projects.status, 'Completed'),
        ne(projects.status, 'Cancelled'),
      )
    : undefined;
  const where = and(eq(projects.workspaceId, workspaceId), search, status, client, overdue);
  const page = pageNumber(filters.page);
  const items = database
    .select({ project: projects, clientName: clients.name })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(where)
    .orderBy(
      filters.sort === 'updated' ? desc(projects.updatedAt) : asc(projects.deadline),
      asc(projects.id),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();
  const total = database.select({ value: count() }).from(projects).where(where).get()?.value ?? 0;
  return { items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function getLead(workspaceId: string, leadId: string, database: AppDatabase = db) {
  return database
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)))
    .get();
}

export function getProject(workspaceId: string, projectId: string, database: AppDatabase = db) {
  return database
    .select({ project: projects, clientName: clients.name })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
    .get();
}

export function workspaceClientOptions(workspaceId: string, database: AppDatabase = db) {
  return database
    .select({ id: clients.id, name: clients.name, company: clients.company })
    .from(clients)
    .where(eq(clients.workspaceId, workspaceId))
    .orderBy(asc(clients.name))
    .limit(100)
    .all();
}

export function dashboardData(workspaceId: string, database: AppDatabase = db) {
  const today = new Date().toISOString().slice(0, 10);
  const until = new Date(Date.now() + upcomingDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const totals = {
    clients: database.select({ value: count() }).from(clients).where(eq(clients.workspaceId, workspaceId)).get()?.value ?? 0,
    leads: database.select({ value: count() }).from(leads).where(eq(leads.workspaceId, workspaceId)).get()?.value ?? 0,
    projects: database.select({ value: count() }).from(projects).where(eq(projects.workspaceId, workspaceId)).get()?.value ?? 0,
    activeProjects: database
      .select({ value: count() })
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.status, 'Active')))
      .get()?.value ?? 0,
  };
  const activeProjects = database
    .select({ project: projects, clientName: clients.name })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.status, 'Active')))
    .orderBy(asc(projects.deadline))
    .limit(5)
    .all();
  const deadlines = database
    .select({ project: projects, clientName: clients.name })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(and(
      eq(projects.workspaceId, workspaceId),
      sql`${projects.deadline} >= ${today}`,
      sql`${projects.deadline} <= ${until}`,
      ne(projects.status, 'Completed'),
      ne(projects.status, 'Cancelled'),
    ))
    .orderBy(asc(projects.deadline))
    .limit(5)
    .all();
  const recentActivity = database
    .select()
    .from(activities)
    .where(eq(activities.workspaceId, workspaceId))
    .orderBy(desc(activities.createdAt))
    .limit(8)
    .all();
  return { totals, activeProjects, deadlines, recentActivity };
}
