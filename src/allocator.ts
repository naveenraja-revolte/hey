import { config } from "./config.js";
import { prisma } from "./db.js";
import {
  AgentCandidate,
  AllocationStrategy,
  createAllocationStrategy,
  TicketCandidate,
} from "./strategies.js";

const ACTIVE_TICKET_STATUSES = ["assigned", "in_progress", "escalated"] as const;
const MAX_AGENT_CANDIDATES = 500;

interface AllocateOptions {
  limit?: number;
  strategy?: AllocationStrategy;
}

export interface AllocationResult {
  considered: number;
  assigned: number;
  unassigned: number;
  strategy: string;
  assignments: Array<{ ticketId: string; agentId: string }>;
}

function toCandidate(ticket: {
  id: string;
  version: number;
  priority: TicketCandidate["priority"];
  createdAt: Date;
  firstResponseDueAt: Date;
  firstResponseAt: Date | null;
  slaDueAt: Date;
  queue: { priorityWeight: number };
  requiredSkills: Array<{ skill: string }>;
}): TicketCandidate {
  return {
    id: ticket.id,
    version: ticket.version,
    priority: ticket.priority,
    queuePriorityWeight: ticket.queue.priorityWeight,
    createdAt: ticket.createdAt,
    firstResponseDueAt: ticket.firstResponseDueAt,
    firstResponseAt: ticket.firstResponseAt,
    slaDueAt: ticket.slaDueAt,
    requiredSkills: ticket.requiredSkills.map(({ skill }) => skill),
  };
}

async function eligibleAgentPool(tickets: TicketCandidate[]): Promise<AgentCandidate[]> {
  if (tickets.length === 0) return [];
  const requiredSkills = [...new Set(tickets.flatMap((ticket) => ticket.requiredSkills))];
  const hasSkilllessTicket = tickets.some((ticket) => ticket.requiredSkills.length === 0);
  const agents = await prisma.agent.findMany({
    where: {
      status: "online",
      ...(requiredSkills.length > 0 && !hasSkilllessTicket
        ? { skills: { some: { skill: { in: requiredSkills } } } }
        : {}),
    },
    select: {
      id: true,
      maxConcurrent: true,
      lastAssignedAt: true,
      skills: { select: { skill: true, proficiency: true } },
      _count: {
        select: {
          assignedTickets: {
            where: { status: { in: [...ACTIVE_TICKET_STATUSES] } },
          },
        },
      },
    },
    orderBy: { id: "asc" },
    take: MAX_AGENT_CANDIDATES,
  });

  return agents.map((agent) => ({
    id: agent.id,
    maxConcurrent: agent.maxConcurrent,
    activeLoad: agent._count.assignedTickets,
    lastAssignedAt: agent.lastAssignedAt,
    skills: new Map(agent.skills.map(({ skill, proficiency }) => [skill, proficiency])),
  }));
}

export async function runAllocation({ limit, strategy }: AllocateOptions = {}): Promise<AllocationResult> {
  const batchLimit = Math.min(Math.max(limit ?? config.allocationBatchSize, 1), 500);
  const now = new Date();
  const activeStrategy =
    strategy ??
    createAllocationStrategy(
      config.allocationStrategy,
      config.slaScoring,
      config.skillLoadPenalty,
    );
  const include = {
    queue: { select: { priorityWeight: true } },
    requiredSkills: { select: { skill: true } },
  } as const;
  const orderedIds =
    activeStrategy.name === "sla-aware-priority"
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT t.id
          FROM tickets t
          JOIN queues q ON q.id = t.queue_id
          WHERE t.status IN ('new', 'escalated')
            AND t.assigned_agent_id IS NULL
          ORDER BY (
            ${config.slaScoring.priorityWeight} *
              CASE t.priority WHEN 'P1' THEN 4 WHEN 'P2' THEN 3 WHEN 'P3' THEN 2 ELSE 1 END *
              q.priority_weight
            + ${config.slaScoring.urgencyWeight} * LEAST(
                2.0,
                GREATEST(
                  0.0,
                  1.0 - (
                    EXTRACT(
                      EPOCH FROM (
                        (CASE
                          WHEN t.first_response_at IS NULL
                            AND t.first_response_due_at < t.sla_due_at
                          THEN t.first_response_due_at
                          ELSE t.sla_due_at
                        END) - ${now}
                      )
                    ) / 60.0
                  ) /
                    ${config.slaScoring.urgencyHorizonMinutes}
                )
              )
            + ${config.slaScoring.agingWeight} *
              GREATEST(0.0, EXTRACT(EPOCH FROM (${now} - t.created_at)) / 60.0) /
                ${config.slaScoring.agingHorizonMinutes}
          ) DESC, t.created_at ASC, t.id ASC
          LIMIT ${batchLimit}
        `
      : undefined;
  const tickets = orderedIds
    ? await prisma.ticket.findMany({
        where: { id: { in: orderedIds.map(({ id }) => id) } },
        include,
      })
    : await prisma.ticket.findMany({
        where: {
          status: { in: ["new", "escalated"] },
          assignedAgentId: null,
        },
        include,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: batchLimit,
      });
  const candidates = tickets.map(toCandidate);
  const orderedTickets = activeStrategy.orderTickets(candidates, now);
  const agentPool = await eligibleAgentPool(orderedTickets);
  const localLoads = new Map<string, AgentCandidate>();
  const assignments: AllocationResult["assignments"] = [];
  let unassigned = 0;

  for (const ticket of orderedTickets) {
    const pool = agentPool
      .filter((agent) => ticket.requiredSkills.every((skill) => agent.skills.has(skill)))
      .map((agent) => {
        const localAgent = localLoads.get(agent.id);
        return localAgent
          ? {
              ...agent,
              activeLoad: localAgent.activeLoad,
              lastAssignedAt: localAgent.lastAssignedAt,
            }
          : { ...agent };
      });
    const eligible = pool.filter((agent) => agent.activeLoad < agent.maxConcurrent);
    const preferred = activeStrategy.chooseAgent(ticket, eligible, now);
    const rankedAgents = preferred
      ? [preferred, ...eligible.filter((agent) => agent.id !== preferred.id)]
      : [];
    let assignedAgent: AgentCandidate | undefined;

    for (const candidate of rankedAgents) {
      const locked = await prisma.$transaction(async (tx) => {
        // Ticket first, agent second: all assignment writers follow the same lock order.
        const lockedTicket = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM tickets
          WHERE id = ${ticket.id}::uuid
            AND status IN ('new', 'escalated')
            AND assigned_agent_id IS NULL
            AND version = ${ticket.version}
          FOR UPDATE SKIP LOCKED
        `;
        if (lockedTicket.length === 0) return false;

        const lockedAgent = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM agents
          WHERE id = ${candidate.id}::uuid
            AND status = 'online'
          FOR UPDATE
        `;
        if (lockedAgent.length === 0) return false;

        const currentAgent = await tx.agent.findFirst({
          where: {
            id: candidate.id,
            status: "online",
            AND: ticket.requiredSkills.map((skill) => ({ skills: { some: { skill } } })),
          },
          select: { id: true, maxConcurrent: true, skills: { select: { skill: true } } },
        });
        if (!currentAgent) return false;

        const activeLoad = await tx.ticket.count({
          where: {
            assignedAgentId: candidate.id,
            status: { in: [...ACTIVE_TICKET_STATUSES] },
          },
        });
        if (activeLoad >= currentAgent.maxConcurrent) return false;

        const changed = await tx.ticket.updateMany({
          where: {
            id: ticket.id,
            status: { in: ["new", "escalated"] },
            assignedAgentId: null,
          },
          data: {
            assignedAgentId: candidate.id,
            status: ticketStatusForAssignment(ticket.id, tickets),
            version: { increment: 1 },
          },
        });
        if (changed.count !== 1) return false;

        await tx.assignmentHistory.create({
          data: {
            ticketId: ticket.id,
            agentId: candidate.id,
            action: "assigned",
            strategy: activeStrategy.name,
          },
        });
        await tx.agent.update({
          where: { id: candidate.id },
          data: { lastAssignedAt: now },
        });
        return true;
      });

      if (locked) {
        assignedAgent = candidate;
        assignedAgent.activeLoad += 1;
        assignedAgent.lastAssignedAt = now;
        localLoads.set(candidate.id, assignedAgent);
        assignments.push({ ticketId: ticket.id, agentId: candidate.id });
        break;
      }
    }

    if (!assignedAgent) unassigned += 1;
  }

  return {
    considered: orderedTickets.length,
    assigned: assignments.length,
    unassigned,
    strategy: activeStrategy.name,
    assignments,
  };
}

function ticketStatusForAssignment(
  ticketId: string,
  tickets: Array<{ id: string; status: string }>,
): "assigned" | "escalated" {
  return tickets.find((ticket) => ticket.id === ticketId)?.status === "escalated"
    ? "escalated"
    : "assigned";
}
