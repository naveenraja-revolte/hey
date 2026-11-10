import { randomUUID } from 'node:crypto';
import { and, asc, count, eq, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { memberships, teams, topics } from '@/db/app-schema';

export function getAdminData() {
  const teamList = db
    .select({
      id: teams.id,
      name: teams.name,
      memberCount: count(memberships.userId),
    })
    .from(teams)
    .leftJoin(memberships, eq(teams.id, memberships.teamId))
    .groupBy(teams.id, teams.name)
    .orderBy(asc(teams.name))
    .all();

  const topicList = db
    .select({
      id: topics.id,
      name: topics.name,
      teamId: teams.id,
      teamName: teams.name,
      active: topics.active,
    })
    .from(topics)
    .innerJoin(teams, eq(topics.teamId, teams.id))
    .orderBy(asc(teams.name), asc(topics.name))
    .all();

  const memberList = db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      teamId: teams.id,
      teamName: teams.name,
      lastAutoAssignedAt: memberships.lastAutoAssignedAt,
    })
    .from(memberships)
    .innerJoin(schema.user, eq(memberships.userId, schema.user.id))
    .innerJoin(teams, eq(memberships.teamId, teams.id))
    .where(eq(schema.user.role, 'member'))
    .orderBy(asc(teams.name), asc(schema.user.name))
    .all();

  const pendingMembers = db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .leftJoin(memberships, eq(schema.user.id, memberships.userId))
    .where(sql`${schema.user.role} = 'member' and ${memberships.userId} is null`)
    .orderBy(asc(schema.user.createdAt))
    .all();

  return { teams: teamList, topics: topicList, members: memberList, pendingMembers };
}

export function createTeam(name: string) {
  db.insert(teams)
    .values({ id: randomUUID(), name })
    .run();
}

export function renameTeam(id: string, name: string) {
  db.update(teams).set({ name }).where(eq(teams.id, id)).run();
}

export function createTopic(name: string, teamId: string) {
  db.insert(topics)
    .values({ id: randomUUID(), name, teamId, active: true })
    .run();
}

export function renameTopic(id: string, name: string) {
  db.update(topics).set({ name }).where(eq(topics.id, id)).run();
}

export function setTopicActive(id: string, active: boolean) {
  db.update(topics).set({ active }).where(eq(topics.id, id)).run();
}

export function assignMemberToTeam(userId: string, teamId: string) {
  const [account] = db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1)
    .all();

  const [team] = db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId)).limit(1).all();

  if (!account || !team) {
    throw new Error('Choose an existing staff account and team.');
  }

  const [member] = db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .all();

  if (!member) {
    throw new Error('The staff account is no longer available.');
  }

  db.insert(memberships)
    .values({ userId, teamId })
    .onConflictDoUpdate({
      target: memberships.userId,
      set: { teamId },
    })
    .run();
}

export function isTeamNameAvailable(name: string, excludeId?: string) {
  const matches = db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.name, name))
    .all();

  return matches.every((team) => team.id === excludeId);
}

export function isTopicNameAvailable(name: string, teamId: string, excludeId?: string) {
  const matches = db
    .select({ id: topics.id })
    .from(topics)
    .where(eq(topics.teamId, teamId))
    .all();

  return matches.every((topic) => topic.id === excludeId || topic.name !== name);
}
