import { randomUUID } from 'node:crypto';
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  like,
  or,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db, schema } from '@/db';
import { memberships, tickets, topics, teams, type TicketStatus } from '@/db/app-schema';
import { canUpdateTicketStatus } from '@/lib/permissions';
import type { Viewer } from '@/lib/viewer';

const assignee = alias(schema.user, 'assignee');
const requester = alias(schema.user, 'requester');
export const TICKETS_PER_PAGE = 25;

export type TicketFilters = {
  status: 'all' | TicketStatus;
  query: string;
  page: number;
};

export type TicketListItem = {
  id: string;
  subject: string;
  status: TicketStatus;
  topicName: string;
  teamName: string;
  assigneeName: string;
  requesterName: string;
  createdAt: Date;
  updatedAt: Date;
};

export class NoEligibleAssigneeError extends Error {
  constructor() {
    super('This topic has no active team members yet. Ask an admin to add a teammate before submitting.');
    this.name = 'NoEligibleAssigneeError';
  }
}

export class TicketNotAvailableError extends Error {
  constructor() {
    super('This ticket is no longer available to you.');
    this.name = 'TicketNotAvailableError';
  }
}

export class InvalidTopicError extends Error {
  constructor() {
    super('Choose an active topic.');
    this.name = 'InvalidTopicError';
  }
}

export function listTickets(viewer: Viewer, filters: TicketFilters) {
  const page = Math.max(1, Math.floor(filters.page));
  const conditions = [];

  if (viewer.role === 'member') {
    conditions.push(eq(tickets.assigneeId, viewer.id));
  }

  if (filters.status !== 'all') {
    conditions.push(eq(tickets.status, filters.status));
  }

  if (filters.query) {
    const pattern = `%${filters.query}%`;
    conditions.push(or(like(tickets.subject, pattern), like(tickets.description, pattern))!);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalRow] = db.select({ total: count() }).from(tickets).where(where).all();
  const total = totalRow?.total ?? 0;
  const rows = db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      status: tickets.status,
      topicName: topics.name,
      teamName: teams.name,
      assigneeName: assignee.name,
      requesterName: requester.name,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .innerJoin(topics, eq(tickets.topicId, topics.id))
    .innerJoin(teams, eq(topics.teamId, teams.id))
    .innerJoin(assignee, eq(tickets.assigneeId, assignee.id))
    .innerJoin(requester, eq(tickets.createdBy, requester.id))
    .where(where)
    .orderBy(desc(tickets.updatedAt), asc(tickets.id))
    .limit(TICKETS_PER_PAGE)
    .offset((page - 1) * TICKETS_PER_PAGE)
    .all();

  return {
    items: rows as TicketListItem[],
    page,
    pageSize: TICKETS_PER_PAGE,
    total,
    totalPages: Math.max(1, Math.ceil(total / TICKETS_PER_PAGE)),
  };
}

export function getTicketForViewer(id: string, viewer: Viewer) {
  const conditions = [eq(tickets.id, id)];

  if (viewer.role === 'member') {
    conditions.push(eq(tickets.assigneeId, viewer.id));
  }

  const [ticket] = db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      description: tickets.description,
      status: tickets.status,
      topicId: topics.id,
      topicName: topics.name,
      teamName: teams.name,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      requesterName: requester.name,
      requesterEmail: requester.email,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .innerJoin(topics, eq(tickets.topicId, topics.id))
    .innerJoin(teams, eq(topics.teamId, teams.id))
    .innerJoin(assignee, eq(tickets.assigneeId, assignee.id))
    .innerJoin(requester, eq(tickets.createdBy, requester.id))
    .where(and(...conditions))
    .limit(1)
    .all();

  return ticket ?? null;
}

export function getActiveTicketTopics() {
  return db
    .select({
      id: topics.id,
      name: topics.name,
      teamName: teams.name,
    })
    .from(topics)
    .innerJoin(teams, eq(topics.teamId, teams.id))
    .where(eq(topics.active, true))
    .orderBy(asc(teams.name), asc(topics.name))
    .all();
}

export function getActiveAssignees() {
  return db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      teamName: teams.name,
    })
    .from(memberships)
    .innerJoin(schema.user, eq(memberships.userId, schema.user.id))
    .innerJoin(teams, eq(memberships.teamId, teams.id))
    .where(eq(schema.user.role, 'member'))
    .orderBy(asc(teams.name), asc(schema.user.name))
    .all();
}

export function createTicket(input: {
  subject: string;
  description: string;
  topicId: string;
  createdBy: string;
}) {
  const now = new Date();
  const ticketId = randomUUID();

  return db.transaction((transaction) => {
    const [topic] = transaction
      .select({ id: topics.id, teamId: topics.teamId })
      .from(topics)
      .where(and(eq(topics.id, input.topicId), eq(topics.active, true)))
      .limit(1)
      .all();

    if (!topic) {
      throw new InvalidTopicError();
    }

    const openLoad = sql<number>`count(${tickets.id})`;
    const candidates = transaction
      .select({
        userId: memberships.userId,
        name: schema.user.name,
        openCount: openLoad,
        lastAutoAssignedAt: memberships.lastAutoAssignedAt,
      })
      .from(memberships)
      .innerJoin(schema.user, eq(memberships.userId, schema.user.id))
      .leftJoin(
        tickets,
        and(
          eq(tickets.assigneeId, memberships.userId),
          inArray(tickets.status, ['new', 'in_progress']),
        ),
      )
      .where(and(eq(memberships.teamId, topic.teamId), eq(schema.user.role, 'member')))
      .groupBy(memberships.userId, schema.user.name, memberships.lastAutoAssignedAt)
      .orderBy(asc(openLoad), asc(memberships.lastAutoAssignedAt), asc(memberships.userId))
      .all();

    const chosen = candidates[0];

    if (!chosen) {
      throw new NoEligibleAssigneeError();
    }

    transaction
      .insert(tickets)
      .values({
        id: ticketId,
        subject: input.subject,
        description: input.description,
        topicId: topic.id,
        createdBy: input.createdBy,
        assigneeId: chosen.userId,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      })
      .run();

    transaction
      .update(memberships)
      .set({ lastAutoAssignedAt: now })
      .where(eq(memberships.userId, chosen.userId))
      .run();

    return {
      id: ticketId,
      assigneeName: chosen.name,
    };
  });
}

export function updateTicketStatus(
  id: string,
  status: TicketStatus,
  viewer: Viewer,
) {
  if (viewer.role !== 'member') {
    throw new TicketNotAvailableError();
  }

  const [ticket] = db
    .select({ id: tickets.id, assigneeId: tickets.assigneeId })
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1)
    .all();

  if (!ticket || !canUpdateTicketStatus(viewer, ticket)) {
    throw new TicketNotAvailableError();
  }

  db.update(tickets)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(tickets.id, id), eq(tickets.assigneeId, viewer.id)))
    .run();
}

export function reassignTicket(id: string, assigneeId: string, viewer: Viewer) {
  if (viewer.role !== 'admin') {
    throw new TicketNotAvailableError();
  }

  return db.transaction((transaction) => {
    const [ticket] = transaction
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1)
      .all();

    const [target] = transaction
      .select({ id: memberships.userId })
      .from(memberships)
      .innerJoin(schema.user, eq(memberships.userId, schema.user.id))
      .where(and(eq(memberships.userId, assigneeId), eq(schema.user.role, 'member')))
      .limit(1)
      .all();

    if (!ticket || !target) {
      throw new TicketNotAvailableError();
    }

    transaction
      .update(tickets)
      .set({ assigneeId: target.id, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .run();
  });
}
