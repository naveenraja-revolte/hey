import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import helmet from "@fastify/helmet";
import { Prisma } from "./generated/prisma/client.js";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { jobQueue, redis } from "./jobs.js";
import { runAllocation } from "./allocator.js";
import { getMetricsSummary } from "./metrics.js";
import { conflict, HttpError, notFound } from "./errors.js";
import {
  agentCreateSchema,
  agentPatchSchema,
  agentStatusSchema,
  allocationRunSchema,
  idSchema,
  manualAssignmentSchema,
  paginationSchema,
  queueCreateSchema,
  queuePatchSchema,
  ticketCreateSchema,
  ticketPatchSchema,
  transitionSchema,
} from "./schemas.js";
import { createAllocationStrategy } from "./strategies.js";

const ACTIVE_TICKET_STATUSES = ["assigned", "in_progress", "escalated"] as const;
const TRANSITIONS: Record<string, readonly string[]> = {
  new: ["escalated"],
  assigned: ["in_progress", "resolved", "escalated"],
  in_progress: ["resolved", "escalated"],
  resolved: [],
  escalated: ["assigned", "in_progress", "resolved"],
};

type RouteRequest = FastifyRequest<{ Params: { id: string } }>;

function parse<T>(schema: { parse: (input: unknown) => T }, input: unknown): T {
  try {
    return schema.parse(input);
  } catch {
    throw new HttpError(400, "validation_error", "Request validation failed");
  }
}

function prismaErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  return String(error.code);
}

function serializeAgentSkills(skills: Array<{ skill: string; proficiency: number }>) {
  return { create: skills };
}

function queueSkills(requiredSkills: string[]) {
  return { create: requiredSkills.map((skill) => ({ skill })) };
}

function ticketSkills(requiredSkills: string[]) {
  return { create: requiredSkills.map((skill) => ({ skill })) };
}

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === "test" ? "silent" : "info",
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
    bodyLimit: 1_000_000,
    requestTimeout: 30_000,
  });
  await app.register(helmet);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
    }

    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      const statusCode = error.statusCode;
      const code = statusCode === 404 ? "not_found" : statusCode === 413 ? "payload_too_large" : "bad_request";
      const message = statusCode === 404
        ? "Route was not found"
        : statusCode === 413
          ? "Request body is too large"
          : "Request could not be processed";
      return reply.status(statusCode).send({ error: { code, message } });
    }

    const code = prismaErrorCode(error);
    if (code === "P2002") {
      return reply.status(409).send({
        error: { code: "conflict", message: "A record with the same unique value already exists" },
      });
    }
    if (code === "P2025") {
      return reply.status(404).send({ error: { code: "not_found", message: "Record was not found" } });
    }
    if (code === "P2003") {
      return reply.status(409).send({
        error: { code: "referential_integrity", message: "The operation conflicts with related records" },
      });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      request.log.error({ error }, "Database request failed");
    } else {
      request.log.error({ error }, "Request failed");
    }
    return reply.status(500).send({
      error: { code: "internal_error", message: "An unexpected error occurred" },
    });
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/ready", async (_request, reply) => {
    try {
      await Promise.all([prisma.$queryRaw`SELECT 1`, redis.ping()]);
      return { status: "ready" };
    } catch (error) {
      app.log.error({ error }, "Readiness check failed");
      return reply.status(503).send({
        error: { code: "dependencies_unavailable", message: "Required dependencies are unavailable" },
      });
    }
  });

  app.get("/agents", async (request) => {
    const { limit, cursor } = parse(paginationSchema, request.query);
    const rows = await prisma.agent.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { skills: true },
    });
    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    return { data, nextCursor: hasMore ? data.at(-1)?.id ?? null : null };
  });

  app.post("/agents", async (request, reply) => {
    const body = parse(agentCreateSchema, request.body);
    const agent = await prisma.agent.create({
      data: {
        name: body.name,
        email: body.email,
        maxConcurrent: body.maxConcurrent,
        shiftStartMinute: body.shiftStartMinute,
        shiftEndMinute: body.shiftEndMinute,
        timezone: body.timezone,
        status: body.status,
        skills: serializeAgentSkills(body.skills),
      },
      include: { skills: true },
    });
    return reply.status(201).send(agent);
  });

  app.get("/agents/:id", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const agent = await prisma.agent.findUnique({ where: { id }, include: { skills: true } });
    if (!agent) throw notFound("Agent");
    return reply.send(agent);
  });

  app.patch("/agents/:id", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const body = parse(agentPatchSchema, request.body);
    const agent = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM agents WHERE id = ${id}::uuid FOR UPDATE`;
      const activeLoad = await tx.ticket.count({
        where: { assignedAgentId: id, status: { in: [...ACTIVE_TICKET_STATUSES] } },
      });
      if (body.maxConcurrent !== undefined && body.maxConcurrent < activeLoad) {
        throw conflict("Agent capacity cannot be reduced below its active ticket count");
      }
      if (body.skills !== undefined && activeLoad > 0) {
        throw conflict("Agent skills cannot change while active tickets are assigned");
      }
      const data: Prisma.AgentUpdateInput = {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.maxConcurrent !== undefined ? { maxConcurrent: body.maxConcurrent } : {}),
        ...(body.shiftStartMinute !== undefined ? { shiftStartMinute: body.shiftStartMinute } : {}),
        ...(body.shiftEndMinute !== undefined ? { shiftEndMinute: body.shiftEndMinute } : {}),
        ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
        ...(body.skills !== undefined
          ? { skills: { deleteMany: {}, create: body.skills } }
          : {}),
      };
      return tx.agent.update({ where: { id }, data, include: { skills: true } });
    });
    return reply.send(agent);
  });

  app.patch("/agents/:id/status", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const { status } = parse(agentStatusSchema, request.body);
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM agents WHERE id = ${id}::uuid FOR UPDATE`;
      const current = await tx.agent.findUnique({ where: { id }, select: { status: true } });
      if (!current) throw notFound("Agent");
      const agent = await tx.agent.update({ where: { id }, data: { status } });
      if (status === "offline" && current.status !== "offline") {
        await tx.outboxEvent.create({
          data: {
            type: "requeue-offline-agent",
            payload: { agentId: id },
          },
        });
      }
      return agent;
    });
    return reply.send(result);
  });

  app.delete("/agents/:id", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM agents WHERE id = ${id}::uuid FOR UPDATE`;
      const active = await tx.ticket.count({
        where: { assignedAgentId: id, status: { in: [...ACTIVE_TICKET_STATUSES] } },
      });
      if (active > 0) throw conflict("An agent with active tickets cannot be deleted");
      await tx.agent.delete({ where: { id } });
    });
    return reply.status(204).send();
  });

  app.get("/queues", async (request) => {
    const { limit, cursor } = parse(paginationSchema, request.query);
    const rows = await prisma.queue.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: { requiredSkills: true },
    });
    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    return { data, nextCursor: hasMore ? data.at(-1)?.id ?? null : null };
  });

  app.post("/queues", async (request, reply) => {
    const body = parse(queueCreateSchema, request.body);
    const queue = await prisma.queue.create({
      data: {
        name: body.name,
        priorityWeight: body.priorityWeight,
        firstResponseSlaMinutes: body.firstResponseSlaMinutes,
        resolutionSlaMinutes: body.resolutionSlaMinutes,
        requiredSkills: queueSkills(body.requiredSkills),
      },
      include: { requiredSkills: true },
    });
    return reply.status(201).send(queue);
  });

  app.get("/queues/:id", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const queue = await prisma.queue.findUnique({ where: { id }, include: { requiredSkills: true } });
    if (!queue) throw notFound("Queue");
    return reply.send(queue);
  });

  app.patch("/queues/:id", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const body = parse(queuePatchSchema, request.body);
    const data: Prisma.QueueUpdateInput = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.priorityWeight !== undefined ? { priorityWeight: body.priorityWeight } : {}),
      ...(body.firstResponseSlaMinutes !== undefined
        ? { firstResponseSlaMinutes: body.firstResponseSlaMinutes }
        : {}),
      ...(body.resolutionSlaMinutes !== undefined
        ? { resolutionSlaMinutes: body.resolutionSlaMinutes }
        : {}),
      ...(body.requiredSkills !== undefined
        ? { requiredSkills: { deleteMany: {}, create: body.requiredSkills.map((skill) => ({ skill })) } }
        : {}),
    };
    const queue = await prisma.queue.update({
      where: { id },
      data,
      include: { requiredSkills: true },
    });
    return reply.send(queue);
  });

  app.delete("/queues/:id", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const ticketCount = await prisma.ticket.count({ where: { queueId: id } });
    if (ticketCount > 0) throw conflict("A queue with tickets cannot be deleted");
    await prisma.queue.delete({ where: { id } });
    return reply.status(204).send();
  });

  app.get("/tickets", async (request) => {
    const { limit, cursor } = parse(paginationSchema, request.query);
    const rows = await prisma.ticket.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { queue: true, requiredSkills: true, assignmentHistory: { orderBy: { createdAt: "asc" } } },
    });
    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    return { data, nextCursor: hasMore ? data.at(-1)?.id ?? null : null };
  });

  app.post("/tickets", async (request, reply) => {
    const body = parse(ticketCreateSchema, request.body);
    const queue = await prisma.queue.findUnique({
      where: { id: body.queueId },
      include: { requiredSkills: true },
    });
    if (!queue) throw notFound("Queue");
    const now = new Date();
    const requiredSkills = body.requiredSkills ?? queue.requiredSkills.map(({ skill }) => skill);
    const ticket = await prisma.ticket.create({
      data: {
        title: body.title,
        description: body.description,
        queueId: queue.id,
        priority: body.priority,
        createdAt: now,
        firstResponseDueAt: new Date(now.getTime() + queue.firstResponseSlaMinutes * 60_000),
        slaDueAt: new Date(now.getTime() + queue.resolutionSlaMinutes * 60_000),
        requiredSkills: ticketSkills(requiredSkills),
      },
      include: { queue: true, requiredSkills: true },
    });
    return reply.status(201).send(ticket);
  });

  app.get("/tickets/:id", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        queue: true,
        requiredSkills: true,
        assignmentHistory: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!ticket) throw notFound("Ticket");
    return reply.send(ticket);
  });

  app.patch("/tickets/:id", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const body = parse(ticketPatchSchema, request.body);
    const ticket = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM tickets WHERE id = ${id}::uuid FOR UPDATE`;
      const current = await tx.ticket.findUnique({
        where: { id },
        include: { queue: { include: { requiredSkills: true } } },
      });
      if (!current) throw notFound("Ticket");
      if (current.assignedAgentId || !["new", "escalated"].includes(current.status)) {
        throw conflict("Only unassigned tickets can be edited");
      }
      const queue = body.queueId
        ? await tx.queue.findUnique({ where: { id: body.queueId }, include: { requiredSkills: true } })
        : current.queue;
      if (!queue) throw notFound("Queue");
      const now = new Date();
      const skills = body.requiredSkills ??
        (body.queueId ? queue.requiredSkills.map(({ skill }) => skill) : undefined);
      const newFirstResponseDueAt = body.queueId
        ? new Date(now.getTime() + queue.firstResponseSlaMinutes * 60_000)
        : undefined;
      const newSlaDueAt = body.queueId
        ? new Date(now.getTime() + queue.resolutionSlaMinutes * 60_000)
        : undefined;
      return tx.ticket.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.priority !== undefined ? { priority: body.priority } : {}),
          ...(body.queueId !== undefined ? { queueId: body.queueId } : {}),
          ...(newFirstResponseDueAt ? { firstResponseDueAt: newFirstResponseDueAt } : {}),
          ...(newSlaDueAt ? { slaDueAt: newSlaDueAt } : {}),
          ...(skills !== undefined
            ? { requiredSkills: { deleteMany: {}, create: skills.map((skill) => ({ skill })) } }
            : {}),
          version: { increment: 1 },
        },
        include: { queue: true, requiredSkills: true },
      });
    });
    return reply.send(ticket);
  });

  app.delete("/tickets/:id", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM tickets WHERE id = ${id}::uuid FOR UPDATE`;
      const ticket = await tx.ticket.findUnique({
        where: { id },
        select: { status: true, assignedAgentId: true, _count: { select: { assignmentHistory: true } } },
      });
      if (!ticket) throw notFound("Ticket");
      if (ticket.status !== "new" || ticket.assignedAgentId || ticket._count.assignmentHistory > 0) {
        throw conflict("Only never-assigned new tickets can be deleted");
      }
      await tx.ticket.delete({ where: { id } });
    });
    return reply.status(204).send();
  });

  app.post("/tickets/:id/transitions", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const { status } = parse(transitionSchema, request.body);
    const ticket = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM tickets WHERE id = ${id}::uuid FOR UPDATE`;
      const current = await tx.ticket.findUnique({
        where: { id },
        select: { status: true, assignedAgentId: true, firstResponseAt: true },
      });
      if (!current) throw notFound("Ticket");
      if (!TRANSITIONS[current.status]?.includes(status)) {
        throw conflict(`Ticket cannot transition from ${current.status} to ${status}`);
      }
      if (["assigned", "in_progress"].includes(status) && !current.assignedAgentId) {
        throw conflict("A ticket must have an assigned agent before work can begin");
      }
      const now = new Date();
      return tx.ticket.update({
        where: { id },
        data: {
          status,
          ...(status === "in_progress" && !current.firstResponseAt ? { firstResponseAt: now } : {}),
          ...(status === "resolved"
            ? { resolvedAt: now, firstResponseAt: current.firstResponseAt ?? now }
            : {}),
          version: { increment: 1 },
        },
      });
    });
    return reply.send(ticket);
  });

  app.patch("/tickets/:id/assignment", async (request, reply) => {
    const { id } = parse(idSchema, (request as RouteRequest).params.id);
    const body = parse(manualAssignmentSchema, request.body);
    const ticket = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM tickets WHERE id = ${id}::uuid FOR UPDATE`;
      const current = await tx.ticket.findUnique({
        where: { id },
        include: { requiredSkills: { select: { skill: true } } },
      });
      if (!current) throw notFound("Ticket");
      if (!["new", "assigned", "in_progress", "escalated"].includes(current.status)) {
        throw conflict("Resolved tickets cannot be assigned");
      }
      if (current.assignedAgentId === body.agentId) return current;

      await tx.$queryRaw`SELECT id FROM agents WHERE id = ${body.agentId}::uuid FOR UPDATE`;
      const agent = await tx.agent.findFirst({
        where: {
          id: body.agentId,
          status: "online",
          AND: current.requiredSkills.map(({ skill }) => ({ skills: { some: { skill } } })),
        },
        select: { id: true, maxConcurrent: true },
      });
      if (!agent) throw conflict("The selected agent is offline or lacks required skills");

      const activeLoad = await tx.ticket.count({
        where: {
          assignedAgentId: agent.id,
          status: { in: [...ACTIVE_TICKET_STATUSES] },
        },
      });
      if (activeLoad >= agent.maxConcurrent) throw conflict("The selected agent is at capacity");

      const fromAgentId = current.assignedAgentId;
      const newStatus = current.status === "new" ? "assigned" : current.status;
      const updated = await tx.ticket.update({
        where: { id },
        data: {
          assignedAgentId: agent.id,
          status: newStatus,
          version: { increment: 1 },
        },
        include: { assignmentHistory: true },
      });
      await tx.assignmentHistory.create({
        data: {
          ticketId: id,
          agentId: agent.id,
          fromAgentId,
          action: "manual_override",
          actor: "operator",
          reason: body.reason,
        },
      });
      await tx.agent.update({ where: { id: agent.id }, data: { lastAssignedAt: new Date() } });
      return updated;
    });
    return reply.send(ticket);
  });

  app.post("/allocate/run", async (request, reply) => {
    const body = parse(allocationRunSchema, request.body ?? {});
    const strategy = body.strategy
      ? createAllocationStrategy(body.strategy, config.slaScoring, config.skillLoadPenalty)
      : undefined;
    return reply.send(await runAllocation({ limit: body.limit, strategy }));
  });

  app.get("/metrics/summary", async () => getMetricsSummary());

  app.addHook("onClose", async () => {
    await jobQueue.close();
    await redis.quit();
    await prisma.$disconnect();
  });

  return app;
}
