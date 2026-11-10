import { config } from "./config.js";
import { createApp } from "./app.js";

const app = await createApp();
await app.listen({ host: config.host, port: config.port });

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, "Shutting down HTTP service");
  await app.close();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
