import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  ALLOCATION_STRATEGY: z
    .enum(["round-robin", "least-loaded", "skill-weighted", "sla-aware-priority"])
    .default("sla-aware-priority"),
  ALLOCATION_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(100),
  ESCALATION_WINDOW_MINUTES: z.coerce.number().int().min(1).max(1440).default(5),
  SLA_PRIORITY_WEIGHT: z.coerce.number().nonnegative().default(5),
  SLA_URGENCY_WEIGHT: z.coerce.number().nonnegative().default(10),
  SLA_AGING_WEIGHT: z.coerce.number().nonnegative().default(2),
  SLA_URGENCY_HORIZON_MINUTES: z.coerce.number().positive().default(60),
  SLA_AGING_HORIZON_MINUTES: z.coerce.number().positive().default(240),
  SKILL_LOAD_PENALTY: z.coerce.number().nonnegative().default(1),
});

const parsed = environmentSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(parsed.error)}`);
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  host: parsed.data.HOST,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  redisUrl: parsed.data.REDIS_URL,
  allocationStrategy: parsed.data.ALLOCATION_STRATEGY,
  allocationBatchSize: parsed.data.ALLOCATION_BATCH_SIZE,
  escalationWindowMinutes: parsed.data.ESCALATION_WINDOW_MINUTES,
  slaScoring: {
    priorityWeight: parsed.data.SLA_PRIORITY_WEIGHT,
    urgencyWeight: parsed.data.SLA_URGENCY_WEIGHT,
    agingWeight: parsed.data.SLA_AGING_WEIGHT,
    urgencyHorizonMinutes: parsed.data.SLA_URGENCY_HORIZON_MINUTES,
    agingHorizonMinutes: parsed.data.SLA_AGING_HORIZON_MINUTES,
  },
  skillLoadPenalty: parsed.data.SKILL_LOAD_PENALTY,
} as const;
