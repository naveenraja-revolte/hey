import { prisma } from "../src/db.js";

const agents = [
  {
    name: "Maya Chen",
    email: "maya.chen@example.test",
    maxConcurrent: 4,
    shiftStartMinute: 480,
    shiftEndMinute: 960,
    timezone: "America/Los_Angeles",
    status: "online" as const,
    skills: {
      create: [
        { skill: "billing", proficiency: 5 },
        { skill: "account-access", proficiency: 4 },
      ],
    },
  },
  {
    name: "Noah Williams",
    email: "noah.williams@example.test",
    maxConcurrent: 3,
    shiftStartMinute: 540,
    shiftEndMinute: 1020,
    timezone: "America/New_York",
    status: "online" as const,
    skills: {
      create: [
        { skill: "technical-support", proficiency: 5 },
        { skill: "billing", proficiency: 3 },
      ],
    },
  },
  {
    name: "Priya Shah",
    email: "priya.shah@example.test",
    maxConcurrent: 5,
    shiftStartMinute: 420,
    shiftEndMinute: 900,
    timezone: "Europe/London",
    status: "away" as const,
    skills: {
      create: [
        { skill: "technical-support", proficiency: 4 },
        { skill: "account-access", proficiency: 5 },
      ],
    },
  },
];

const queues = [
  {
    name: "Billing & Payments",
    priorityWeight: 1.2,
    firstResponseSlaMinutes: 30,
    resolutionSlaMinutes: 240,
    requiredSkills: {
      create: [{ skill: "billing" }],
    },
  },
  {
    name: "Technical Support",
    priorityWeight: 1,
    firstResponseSlaMinutes: 60,
    resolutionSlaMinutes: 480,
    requiredSkills: {
      create: [{ skill: "technical-support" }],
    },
  },
  {
    name: "Account Access",
    priorityWeight: 1.1,
    firstResponseSlaMinutes: 20,
    resolutionSlaMinutes: 120,
    requiredSkills: {
      create: [{ skill: "account-access" }],
    },
  },
];

for (const agent of agents) {
  await prisma.agent.upsert({
    where: { email: agent.email },
    update: {},
    create: agent,
  });
}

for (const queue of queues) {
  await prisma.queue.upsert({
    where: { name: queue.name },
    update: {},
    create: queue,
  });
}

await prisma.$disconnect();
