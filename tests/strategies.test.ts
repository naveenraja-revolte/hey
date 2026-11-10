import { describe, expect, it } from "vitest";
import {
  type AgentCandidate,
  type AllocationStrategy,
  RoundRobinStrategy,
  SlaAwarePriorityStrategy,
  type TicketCandidate,
} from "../src/strategies.js";

const now = new Date("2026-04-01T12:00:00.000Z");
const weights = {
  priorityWeight: 5,
  urgencyWeight: 10,
  agingWeight: 2,
  urgencyHorizonMinutes: 60,
  agingHorizonMinutes: 240,
};
const singleAgent: AgentCandidate[] = [
  {
    id: "agent-1",
    maxConcurrent: 1,
    activeLoad: 0,
    lastAssignedAt: null,
    skills: new Map([["billing", 5]]),
  },
];
const tickets: TicketCandidate[] = [
  {
    id: "older-p4",
    version: 0,
    priority: "P4",
    queuePriorityWeight: 1,
    createdAt: new Date(now.getTime() - 120 * 60_000),
    firstResponseDueAt: new Date(now.getTime() + 30 * 60_000),
    firstResponseAt: null,
    slaDueAt: new Date(now.getTime() + 180 * 60_000),
    requiredSkills: ["billing"],
  },
  {
    id: "urgent-p1",
    version: 0,
    priority: "P1",
    queuePriorityWeight: 1,
    createdAt: new Date(now.getTime() - 5 * 60_000),
    firstResponseDueAt: new Date(now.getTime() + 10 * 60_000),
    firstResponseAt: null,
    slaDueAt: new Date(now.getTime() + 15 * 60_000),
    requiredSkills: ["billing"],
  },
];

function simulate(strategy: AllocationStrategy) {
  const pending = strategy.orderTickets(tickets, now);
  const serviceMinutes = 10;
  const completionTimes = [
    new Date(now.getTime() + serviceMinutes * 60_000),
    new Date(now.getTime() + serviceMinutes * 2 * 60_000),
  ];

  return {
    assignedFirst: pending[0]?.id,
    breached: pending.filter(
      (ticket, index) => completionTimes[index]!.getTime() > ticket.slaDueAt.getTime(),
    ).length,
  };
}

describe("allocation strategies", () => {
  it("gives the least-loaded eligible agent priority", () => {
    const strategy = new SlaAwarePriorityStrategy(weights, 1);
    const agents = [
      { ...singleAgent[0]!, id: "busy", activeLoad: 1 },
      { ...singleAgent[0]!, id: "free", activeLoad: 0 },
    ];

    expect(strategy.chooseAgent(tickets[1]!, agents, now)?.id).toBe("free");
  });

  it("orders an imminent P1 ahead of an older P4", () => {
    const strategy = new SlaAwarePriorityStrategy(weights, 1);

    expect(strategy.orderTickets(tickets, now)[0]?.id).toBe("urgent-p1");
  });

  it("eventually promotes aged low-priority tickets above newer work", () => {
    const strategy = new SlaAwarePriorityStrategy(weights, 1);
    const agedLowPriority = {
      ...tickets[0]!,
      id: "aged-p4",
      createdAt: new Date(now.getTime() - 36 * 60 * 60_000),
      firstResponseAt: now,
      slaDueAt: new Date(now.getTime() + 3 * 24 * 60 * 60_000),
    };
    const newHighPriority = {
      ...tickets[1]!,
      id: "new-p1",
      createdAt: now,
      firstResponseAt: now,
      slaDueAt: new Date(now.getTime() + 60 * 60_000),
    };

    expect(strategy.orderTickets([newHighPriority, agedLowPriority], now)[0]?.id).toBe("aged-p4");
  });

  it("beats RoundRobin on the fixed SLA scenario", () => {
    const naive = simulate(new RoundRobinStrategy());
    const slaAware = simulate(new SlaAwarePriorityStrategy(weights, 1));

    expect(naive.assignedFirst).toBe("older-p4");
    expect(slaAware.assignedFirst).toBe("urgent-p1");
    expect(slaAware.breached).toBeLessThan(naive.breached);
  });
});
