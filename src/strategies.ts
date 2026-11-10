export type TicketPriority = "P1" | "P2" | "P3" | "P4";

export interface TicketCandidate {
  id: string;
  version: number;
  priority: TicketPriority;
  queuePriorityWeight: number;
  createdAt: Date;
  firstResponseDueAt: Date;
  firstResponseAt: Date | null;
  slaDueAt: Date;
  requiredSkills: string[];
}

export interface AgentCandidate {
  id: string;
  maxConcurrent: number;
  activeLoad: number;
  lastAssignedAt: Date | null;
  skills: Map<string, number>;
}

export interface AllocationStrategy {
  readonly name: string;
  orderTickets(tickets: TicketCandidate[], now: Date): TicketCandidate[];
  chooseAgent(
    ticket: TicketCandidate,
    agents: AgentCandidate[],
    now: Date,
  ): AgentCandidate | undefined;
}

export interface SlaScoringWeights {
  priorityWeight: number;
  urgencyWeight: number;
  agingWeight: number;
  urgencyHorizonMinutes: number;
  agingHorizonMinutes: number;
  priorityRank?: Readonly<Record<TicketPriority, number>>;
}

const DEFAULT_PRIORITY_RANK: Readonly<Record<TicketPriority, number>> = {
  P1: 4,
  P2: 3,
  P3: 2,
  P4: 1,
};

const MINUTE_MS = 60_000;

export function skillScore(
  ticket: TicketCandidate,
  agent: AgentCandidate,
  loadPenalty: number,
): number {
  const averageProficiency = ticket.requiredSkills.length
    ? ticket.requiredSkills.reduce((sum, skill) => sum + (agent.skills.get(skill) ?? 0), 0) /
      ticket.requiredSkills.length
    : 0;
  const loadRatio = agent.activeLoad / agent.maxConcurrent;

  return averageProficiency - loadPenalty * loadRatio;
}

/**
 * Formula: priorityWeight × priorityRank × queueWeight
 *   + urgencyWeight × clamp(1 - minutesToNextSla / urgencyHorizonMinutes, 0, 2)
 *   + agingWeight × (ticketAgeMinutes / agingHorizonMinutes).
 * `minutesToNextSla` uses first-response due time until the ticket is first answered, then resolution due time.
 * The unbounded linear aging term ensures old low-priority tickets eventually outrank newer work.
 */
export function slaTicketScore(
  ticket: TicketCandidate,
  now: Date,
  weights: SlaScoringWeights,
): number {
  const priorityRank = (weights.priorityRank ?? DEFAULT_PRIORITY_RANK)[ticket.priority];
  const nextSlaDeadline =
    ticket.firstResponseAt === null && ticket.firstResponseDueAt < ticket.slaDueAt
      ? ticket.firstResponseDueAt
      : ticket.slaDueAt;
  const minutesToSla = (nextSlaDeadline.getTime() - now.getTime()) / MINUTE_MS;
  const ageMinutes = Math.max(0, (now.getTime() - ticket.createdAt.getTime()) / MINUTE_MS);
  const urgencyFactor = Math.min(2, Math.max(0, 1 - minutesToSla / weights.urgencyHorizonMinutes));
  const ageFactor = ageMinutes / weights.agingHorizonMinutes;

  return (
    weights.priorityWeight * priorityRank * ticket.queuePriorityWeight +
    weights.urgencyWeight * urgencyFactor +
    weights.agingWeight * ageFactor
  );
}

function stableAgentId(left: AgentCandidate, right: AgentCandidate): number {
  return left.id.localeCompare(right.id);
}

export class RoundRobinStrategy implements AllocationStrategy {
  readonly name = "round-robin";

  orderTickets(tickets: TicketCandidate[]): TicketCandidate[] {
    return [...tickets].sort(
      (left, right) =>
        left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id),
    );
  }

  chooseAgent(_ticket: TicketCandidate, agents: AgentCandidate[]): AgentCandidate | undefined {
    return [...agents].sort((left, right) => {
      if (left.lastAssignedAt === null && right.lastAssignedAt !== null) return -1;
      if (left.lastAssignedAt !== null && right.lastAssignedAt === null) return 1;
      const timeDifference =
        (left.lastAssignedAt?.getTime() ?? 0) - (right.lastAssignedAt?.getTime() ?? 0);
      return timeDifference || stableAgentId(left, right);
    })[0];
  }
}

export class LeastLoadedStrategy implements AllocationStrategy {
  readonly name = "least-loaded";

  orderTickets(tickets: TicketCandidate[]): TicketCandidate[] {
    return new RoundRobinStrategy().orderTickets(tickets);
  }

  chooseAgent(_ticket: TicketCandidate, agents: AgentCandidate[]): AgentCandidate | undefined {
    return [...agents].sort((left, right) => {
      const loadDifference =
        left.activeLoad / left.maxConcurrent - right.activeLoad / right.maxConcurrent;
      return loadDifference || stableAgentId(left, right);
    })[0];
  }
}

export class SkillWeightedStrategy implements AllocationStrategy {
  readonly name = "skill-weighted";

  constructor(private readonly loadPenalty: number) {}

  orderTickets(tickets: TicketCandidate[]): TicketCandidate[] {
    return new RoundRobinStrategy().orderTickets(tickets);
  }

  chooseAgent(ticket: TicketCandidate, agents: AgentCandidate[]): AgentCandidate | undefined {
    return [...agents].sort((left, right) => {
      const scoreDifference =
        skillScore(ticket, right, this.loadPenalty) - skillScore(ticket, left, this.loadPenalty);
      return scoreDifference || stableAgentId(left, right);
    })[0];
  }
}

export class SlaAwarePriorityStrategy implements AllocationStrategy {
  readonly name = "sla-aware-priority";

  constructor(
    private readonly weights: SlaScoringWeights,
    private readonly loadPenalty: number,
  ) {}

  orderTickets(tickets: TicketCandidate[], now: Date): TicketCandidate[] {
    return [...tickets].sort(
      (left, right) =>
        slaTicketScore(right, now, this.weights) - slaTicketScore(left, now, this.weights) ||
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id),
    );
  }

  chooseAgent(ticket: TicketCandidate, agents: AgentCandidate[]): AgentCandidate | undefined {
    return [...agents].sort((left, right) => {
      const scoreDifference =
        skillScore(ticket, right, this.loadPenalty) - skillScore(ticket, left, this.loadPenalty);
      return scoreDifference || stableAgentId(left, right);
    })[0];
  }
}

export function createAllocationStrategy(
  name: string,
  weights: SlaScoringWeights,
  loadPenalty: number,
): AllocationStrategy {
  switch (name) {
    case "round-robin":
      return new RoundRobinStrategy();
    case "least-loaded":
      return new LeastLoadedStrategy();
    case "skill-weighted":
      return new SkillWeightedStrategy(loadPenalty);
    case "sla-aware-priority":
      return new SlaAwarePriorityStrategy(weights, loadPenalty);
    default:
      throw new Error(`Unknown allocation strategy: ${name}`);
  }
}

export function activeLoadRatio(agent: AgentCandidate): number {
  return agent.activeLoad / agent.maxConcurrent;
}
