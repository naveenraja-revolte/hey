import { Job, Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { createAllocationStrategy } from "./strategies.js";
import { runAllocation } from "./allocator.js";

export const JOB_QUEUE_NAME = "ticket-allocation";
export type BackgroundJob =
  | { type: "requeue-offline-agent"; agentId: string; cursor?: string }
  | { type: "scan-sla" };

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

redis.on("error", (error) => {
  console.error("Redis connection error", error);
});

export const jobQueue = new Queue<BackgroundJob>(JOB_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000,
  },
});

async function publishOutboxEvents(): Promise<void> {
  const pending = await prisma.outboxEvent.findMany({
    where: { status: "pending" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 100,
  });

  for (const event of pending) {
    if (event.type !== "requeue-offline-agent") {
      console.error("Unsupported outbox event type", { eventId: event.id, type: event.type });
      continue;
    }
    const payload = event.payload as { agentId?: unknown };
    if (typeof payload.agentId !== "string") {
      console.error("Invalid offline-agent outbox payload", { eventId: event.id });
      continue;
    }

    await jobQueue.add(
      event.type,
      { type: event.type, agentId: payload.agentId },
      { jobId: event.id },
    );
    await prisma.outboxEvent.updateMany({
      where: { id: event.id, status: "pending" },
      data: { status: "published", publishedAt: new Date() },
    });
  }
}

async function requeueOfflineAgent(agentId: string, cursor?: string): Promise<void> {
  const tickets = await prisma.ticket.findMany({
    where: {
      assignedAgentId: agentId,
      status: { in: ["assigned", "in_progress", "escalated"] },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: 101,
    select: { id: true },
  });
  const batch = tickets.slice(0, 100);

  for (const ticket of batch) {
    await prisma.$transaction(async (tx) => {
      const lockedTicket = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM tickets
        WHERE id = ${ticket.id}::uuid
          AND assigned_agent_id = ${agentId}::uuid
          AND status IN ('assigned', 'in_progress', 'escalated')
        FOR UPDATE SKIP LOCKED
      `;
      if (lockedTicket.length === 0) return;

      const currentAgent = await tx.agent.findUnique({
        where: { id: agentId },
        select: { status: true },
      });
      if (currentAgent?.status !== "offline") return;

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          assignedAgentId: null,
          status: "new",
          version: { increment: 1 },
        },
      });
      await tx.assignmentHistory.create({
        data: {
          ticketId: ticket.id,
          fromAgentId: agentId,
          action: "requeued",
          reason: "Assigned agent went offline",
        },
      });
    });
  }

  if (tickets.length > 100) {
    const lastTicket = batch.at(-1);
    if (lastTicket) {
      await jobQueue.add(
        "requeue-offline-agent",
        { type: "requeue-offline-agent", agentId, cursor: lastTicket.id },
      );
    }
  }
}

async function escalateNearSla(): Promise<void> {
  const dueBefore = new Date(Date.now() + config.escalationWindowMinutes * 60_000);
  const dueSlaCondition = {
    OR: [
      { slaDueAt: { lte: dueBefore } },
      { firstResponseAt: null, firstResponseDueAt: { lte: dueBefore } },
    ],
  };
  const tickets = await prisma.ticket.findMany({
    where: {
      status: { in: ["new", "assigned", "in_progress"] },
      ...dueSlaCondition,
    },
    orderBy: [{ slaDueAt: "asc" }, { id: "asc" }],
    take: config.allocationBatchSize,
    select: { id: true },
  });

  for (const ticket of tickets) {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM tickets
        WHERE id = ${ticket.id}::uuid
          AND status IN ('new', 'assigned', 'in_progress')
          AND (
            sla_due_at <= ${dueBefore}
            OR (first_response_at IS NULL AND first_response_due_at <= ${dueBefore})
          )
        FOR UPDATE SKIP LOCKED
      `;
      if (locked.length === 0) return;

      const changed = await tx.ticket.updateMany({
        where: {
          id: ticket.id,
          status: { in: ["new", "assigned", "in_progress"] },
          ...dueSlaCondition,
        },
        data: { status: "escalated", version: { increment: 1 } },
      });
      if (changed.count === 1) {
        await tx.assignmentHistory.create({
          data: {
            ticketId: ticket.id,
            action: "escalated",
            actor: "system",
            reason: "Automatically escalated near an SLA deadline",
          },
        });
      }
    });
  }
}

export async function startWorker(): Promise<Worker<BackgroundJob>> {
  const worker = new Worker<BackgroundJob>(
    JOB_QUEUE_NAME,
    async (job: Job<BackgroundJob>) => {
      switch (job.data.type) {
        case "requeue-offline-agent":
          await requeueOfflineAgent(job.data.agentId, job.data.cursor);
          await runAllocation();
          break;
        case "scan-sla":
          await escalateNearSla();
          await runAllocation({
            strategy: createAllocationStrategy(
              config.allocationStrategy,
              config.slaScoring,
              config.skillLoadPenalty,
            ),
          });
          break;
      }
    },
    {
      connection: redis,
      concurrency: 4,
    },
  );

  worker.on("failed", (job, error) => {
    console.error("Background job failed", { jobId: job?.id, error });
  });
  worker.on("error", (error) => {
    console.error("Background worker error", error);
  });

  await jobQueue.upsertJobScheduler(
    "sla-scan-every-minute",
    { every: 60_000 },
    { name: "scan-sla", data: { type: "scan-sla" } },
  );

  const outboxTimer = setInterval(() => {
    void publishOutboxEvents().catch((error: unknown) => {
      console.error("Outbox publish cycle failed", error);
    });
  }, 1_000);
  outboxTimer.unref();

  await publishOutboxEvents();
  return worker;
}
