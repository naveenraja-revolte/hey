import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { Pool } from "pg";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";

const integrationEnabled = process.env.RUN_INTEGRATION === "1";
const integrationSuite = describe.skipIf(!integrationEnabled);

async function reservePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not reserve a local port");
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

function spawnNpm(args: string[], environment: NodeJS.ProcessEnv): ChildProcess {
  return spawn("npm", args, {
    cwd: process.cwd(),
    env: environment,
    stdio: ["ignore", "ignore", "pipe"],
  });
}

async function waitForHttp(url: string, child: ChildProcess, output: () => string): Promise<void> {
  const deadline = Date.now() + 20_000;
  let lastError = "No response yet";
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Service process exited with ${child.exitCode}: ${output()}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Service did not become ready (${lastError}): ${output()}`);
}

async function stopProcess(child: ChildProcess | undefined): Promise<void> {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  const forceKill = setTimeout(() => child.kill("SIGKILL"), 5_000);
  await exited;
  clearTimeout(forceKill);
}

integrationSuite("service integration", () => {
  let postgresContainer: Awaited<ReturnType<PostgreSqlContainer["start"]>> | undefined;
  let redisContainer: StartedTestContainer | undefined;
  let appProcess: ChildProcess | undefined;
  let workerProcess: ChildProcess | undefined;
  let appOutput = "";
  let workerOutput = "";
  let baseUrl = "";
  let prisma: PrismaClient;
  let runAllocation: typeof import("../src/allocator.js").runAllocation;
  let RoundRobinStrategy: typeof import("../src/strategies.js").RoundRobinStrategy;
  let jobQueue: typeof import("../src/jobs.js").jobQueue;
  let redis: typeof import("../src/jobs.js").redis;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer("postgres:16-alpine").start();
    redisContainer = await new GenericContainer("redis:7-alpine").withExposedPorts(6379).start();
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = postgresContainer.getConnectionUri();
    process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
    process.env.HOST = "127.0.0.1";
    process.env.PORT = String(await reservePort());
    baseUrl = `http://127.0.0.1:${process.env.PORT}`;

    const migration = await readFile(
      new URL("../prisma/migrations/202611100001_init/migration.sql", import.meta.url),
      "utf8",
    );
    const migrationPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
    await migrationPool.query(migration);
    await migrationPool.end();

    ({ prisma } = await import("../src/db.js"));
    ({ runAllocation } = await import("../src/allocator.js"));
    ({ RoundRobinStrategy } = await import("../src/strategies.js"));
    ({ jobQueue, redis } = await import("../src/jobs.js"));

    appProcess = spawnNpm(["start"], process.env);
    appProcess.stderr?.on("data", (chunk: Buffer) => {
      appOutput = `${appOutput}${chunk.toString()}`.slice(-8_000);
    });
    await waitForHttp(`${baseUrl}/ready`, appProcess, () => appOutput);
  }, 120_000);

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE outbox_events, assignment_history, ticket_required_skills, tickets, queue_required_skills, queues, agent_skills, agents CASCADE`;
  });

  afterAll(async () => {
    await stopProcess(workerProcess);
    await stopProcess(appProcess);
    if (jobQueue) await jobQueue.close();
    if (redis) await redis.quit();
    if (prisma) await prisma.$disconnect();
    if (postgresContainer) await postgresContainer.stop();
    if (redisContainer) await redisContainer.stop();
  });

  it("serves validated CRUD, readiness, allocation, lifecycle, and metrics over HTTP", async () => {
    const health = await fetch(`${baseUrl}/health`);
    expect(health.status).toBe(200);

    const invalidQueue = await fetch(`${baseUrl}/queues`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Broken",
        priorityWeight: 1,
        firstResponseSlaMinutes: 0,
        resolutionSlaMinutes: 30,
      }),
    });
    expect(invalidQueue.status).toBe(400);
    expect((await invalidQueue.json()).error.code).toBe("validation_error");

    const queueResponse = await fetch(`${baseUrl}/queues`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Billing",
        priorityWeight: 1,
        firstResponseSlaMinutes: 30,
        resolutionSlaMinutes: 240,
        requiredSkills: ["billing"],
      }),
    });
    expect(queueResponse.status).toBe(201);
    const queue = await queueResponse.json();

    const agentResponse = await fetch(`${baseUrl}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Avery Kim",
        email: "avery@example.test",
        maxConcurrent: 2,
        shiftStartMinute: 480,
        shiftEndMinute: 960,
        status: "online",
        skills: [{ skill: "billing", proficiency: 5 }],
      }),
    });
    expect(agentResponse.status).toBe(201);
    const agent = await agentResponse.json();
    const unqualifiedAgentResponse = await fetch(`${baseUrl}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Casey Morgan",
        email: "casey@example.test",
        maxConcurrent: 2,
        shiftStartMinute: 480,
        shiftEndMinute: 960,
        status: "online",
        skills: [{ skill: "technical-support", proficiency: 5 }],
      }),
    });
    const unqualifiedAgent = await unqualifiedAgentResponse.json();

    const ticketResponse = await fetch(`${baseUrl}/tickets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Refund not received",
        description: "The refund is not visible on the card statement.",
        queueId: queue.id,
        priority: "P1",
      }),
    });
    expect(ticketResponse.status).toBe(201);
    const ticket = await ticketResponse.json();

    const invalidTransition = await fetch(`${baseUrl}/tickets/${ticket.id}/transitions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    expect(invalidTransition.status).toBe(409);

    const rejectedOverride = await fetch(`${baseUrl}/tickets/${ticket.id}/assignment`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId: unqualifiedAgent.id, reason: "Agent has an unrelated specialty" }),
    });
    expect(rejectedOverride.status).toBe(409);

    const override = await fetch(`${baseUrl}/tickets/${ticket.id}/assignment`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId: agent.id, reason: "Customer requested a billing specialist" }),
    });
    expect(override.status).toBe(200);

    const details = await fetch(`${baseUrl}/tickets/${ticket.id}`);
    const history = (await details.json()).assignmentHistory;
    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "manual_override", reason: "Customer requested a billing specialist" }),
      ]),
    );

    const transition = await fetch(`${baseUrl}/tickets/${ticket.id}/transitions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    expect(transition.status).toBe(200);

    const nextTicketResponse = await fetch(`${baseUrl}/tickets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Duplicate card charge",
        description: "A card charge appears twice.",
        queueId: queue.id,
        priority: "P2",
      }),
    });
    const nextTicket = await nextTicketResponse.json();
    const allocation = await fetch(`${baseUrl}/allocate/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strategy: "sla-aware-priority" }),
    });
    expect(allocation.status).toBe(200);
    expect((await allocation.json()).assigned).toBe(1);
    expect((await fetch(`${baseUrl}/tickets/${nextTicket.id}`).then((response) => response.json())).assignedAgentId).toBe(agent.id);

    const metrics = await fetch(`${baseUrl}/metrics/summary`);
    expect(metrics.status).toBe(200);
    expect(await metrics.json()).toHaveProperty("slaBreachRate");
  });

  it("never double-assigns tickets or exceeds capacity during concurrent runs", async () => {
    const queue = await prisma.queue.create({
      data: {
        name: "Concurrent Billing",
        priorityWeight: 1,
        firstResponseSlaMinutes: 30,
        resolutionSlaMinutes: 240,
        requiredSkills: { create: [{ skill: "billing" }] },
      },
    });
    const agent = await prisma.agent.create({
      data: {
        name: "Jordan Lee",
        email: "jordan@example.test",
        maxConcurrent: 1,
        shiftStartMinute: 0,
        shiftEndMinute: 1439,
        status: "online",
        skills: { create: [{ skill: "billing", proficiency: 5 }] },
      },
    });

    await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        prisma.ticket.create({
          data: {
            title: `Concurrent ticket ${index + 1}`,
            description: "Integration test ticket for allocator concurrency.",
            queueId: queue.id,
            firstResponseDueAt: new Date(Date.now() + 60 * 60_000),
            slaDueAt: new Date(Date.now() + 4 * 60 * 60_000),
            requiredSkills: { create: [{ skill: "billing" }] },
          },
        }),
      ),
    );

    const strategy = new RoundRobinStrategy();
    const runs = await Promise.all(
      Array.from({ length: 5 }, () => runAllocation({ limit: 4, strategy })),
    );
    const assignedTickets = await prisma.ticket.count({ where: { assignedAgentId: agent.id } });
    const assignmentsRecorded = await prisma.assignmentHistory.count({
      where: { action: "assigned", agentId: agent.id },
    });
    const retry = await runAllocation({ limit: 4, strategy });

    expect(runs.reduce((sum, result) => sum + result.assigned, 0)).toBe(1);
    expect(assignedTickets).toBe(1);
    expect(assignmentsRecorded).toBe(1);
    expect(retry.assigned).toBe(0);
  });

  it("requeues offline work and escalates near-breach tickets via BullMQ", async () => {
    const queue = await prisma.queue.create({
      data: {
        name: "Escalation Queue",
        priorityWeight: 1,
        firstResponseSlaMinutes: 30,
        resolutionSlaMinutes: 240,
        requiredSkills: { create: [{ skill: "billing" }] },
      },
    });
    const agent = await prisma.agent.create({
      data: {
        name: "Morgan Reed",
        email: "morgan@example.test",
        maxConcurrent: 3,
        shiftStartMinute: 0,
        shiftEndMinute: 1439,
        status: "online",
        skills: { create: [{ skill: "billing", proficiency: 4 }] },
      },
    });
    const assignedTicket = await prisma.ticket.create({
      data: {
        title: "Assigned ticket",
        description: "This work must be returned to the queue when its agent goes offline.",
        queueId: queue.id,
        firstResponseDueAt: new Date(Date.now() + 60 * 60_000),
        slaDueAt: new Date(Date.now() + 4 * 60 * 60_000),
        requiredSkills: { create: [{ skill: "billing" }] },
      },
    });
    await prisma.ticket.update({
      where: { id: assignedTicket.id },
      data: { assignedAgentId: agent.id, status: "assigned" },
    });
    await prisma.assignmentHistory.create({
      data: { ticketId: assignedTicket.id, agentId: agent.id, action: "assigned", strategy: "test" },
    });

    workerProcess = spawnNpm(["run", "worker"], process.env);
    workerProcess.stderr?.on("data", (chunk: Buffer) => {
      workerOutput = `${workerOutput}${chunk.toString()}`.slice(-8_000);
    });
    const offlineResponse = await fetch(`${baseUrl}/agents/${agent.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "offline" }),
    });
    expect(offlineResponse.status).toBe(200);

    await waitForDatabaseCondition(
      () => prisma.ticket.findUnique({ where: { id: assignedTicket.id } }),
      (ticket) => ticket?.status === "new" && ticket.assignedAgentId === null,
      workerProcess,
      () => workerOutput,
    );

    const nearBreach = await prisma.ticket.create({
      data: {
        title: "SLA nearing breach",
        description: "The worker should escalate this ticket before its deadline.",
        queueId: queue.id,
        firstResponseDueAt: new Date(Date.now() + 60 * 60_000),
        slaDueAt: new Date(Date.now() + 4 * 60_000),
        requiredSkills: { create: [{ skill: "billing" }] },
      },
    });
    const { jobQueue: queueClient } = await import("../src/jobs.js");
    await queueClient.add("scan-sla", { type: "scan-sla" }, { jobId: `test-sla-${Date.now()}` });

    await waitForDatabaseCondition(
      () => prisma.ticket.findUnique({ where: { id: nearBreach.id } }),
      (ticket) => ticket?.status === "escalated",
      workerProcess,
      () => workerOutput,
    );
  });
});

async function waitForDatabaseCondition<T>(
  load: () => Promise<T>,
  isReady: (value: T) => boolean,
  child: ChildProcess,
  output: () => string,
): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Worker exited with ${child.exitCode}: ${output()}`);
    }
    if (isReady(await load())) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Background work did not complete: ${output()}`);
}
