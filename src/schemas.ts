import { z } from "zod";

const skillSchema = z.string().trim().min(1).max(64);
const skillsSchema = z.array(skillSchema).max(50).refine((skills) => new Set(skills).size === skills.length, {
  message: "Skills must be unique",
});
const agentSkillsSchema = z
  .array(
    z.object({
      skill: skillSchema,
      proficiency: z.number().int().min(1).max(5),
    }),
  )
  .max(50)
  .refine((skills) => new Set(skills.map(({ skill }) => skill)).size === skills.length, {
    message: "Agent skills must be unique",
  });

export const idSchema = z.string().uuid();

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: idSchema.optional(),
});

export const agentCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  maxConcurrent: z.number().int().min(1).max(100),
  shiftStartMinute: z.number().int().min(0).max(1439),
  shiftEndMinute: z.number().int().min(0).max(1439),
  timezone: z.string().trim().min(1).max(64).default("UTC"),
  status: z.enum(["online", "busy", "away", "offline"]).default("offline"),
  skills: agentSkillsSchema.default([]),
});

export const agentPatchSchema = agentCreateSchema.partial().omit({ status: true });
export const agentStatusSchema = z.object({
  status: z.enum(["online", "busy", "away", "offline"]),
});

export const queueCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  priorityWeight: z.number().positive().max(100),
  firstResponseSlaMinutes: z.number().int().min(1).max(525600),
  resolutionSlaMinutes: z.number().int().min(1).max(525600),
  requiredSkills: skillsSchema.default([]),
});

export const queuePatchSchema = queueCreateSchema.partial();

export const ticketCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20_000),
  queueId: idSchema,
  priority: z.enum(["P1", "P2", "P3", "P4"]).default("P3"),
  requiredSkills: skillsSchema.optional(),
});

export const ticketPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(20_000).optional(),
  priority: z.enum(["P1", "P2", "P3", "P4"]).optional(),
  queueId: idSchema.optional(),
  requiredSkills: skillsSchema.optional(),
});

export const transitionSchema = z.object({
  status: z.enum(["assigned", "in_progress", "resolved", "escalated"]),
});

export const manualAssignmentSchema = z.object({
  agentId: idSchema,
  reason: z.string().trim().min(5).max(500),
});

export const allocationRunSchema = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  strategy: z
    .enum(["round-robin", "least-loaded", "skill-weighted", "sla-aware-priority"])
    .optional(),
});
