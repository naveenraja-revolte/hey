import { prisma } from "./db.js";
import { jobQueue, redis, startWorker } from "./jobs.js";

const worker = await startWorker();

async function shutdown(signal: string): Promise<void> {
  console.info(`Received ${signal}; shutting down worker`);
  await worker.close();
  await jobQueue.close();
  await redis.quit();
  await prisma.$disconnect();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
