CREATE TYPE "AgentStatus" AS ENUM ('online', 'busy', 'away', 'offline');
CREATE TYPE "TicketPriority" AS ENUM ('P1', 'P2', 'P3', 'P4');
CREATE TYPE "TicketStatus" AS ENUM ('new', 'assigned', 'in_progress', 'resolved', 'escalated');
CREATE TYPE "AssignmentAction" AS ENUM ('assigned', 'requeued', 'manual_override', 'escalated');
CREATE TYPE "OutboxStatus" AS ENUM ('pending', 'published');

CREATE TABLE "agents" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "max_concurrent" INTEGER NOT NULL,
  "shift_start_minute" INTEGER NOT NULL,
  "shift_end_minute" INTEGER NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "status" "AgentStatus" NOT NULL DEFAULT 'offline',
  "last_assigned_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "agents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agents_max_concurrent_positive" CHECK ("max_concurrent" > 0),
  CONSTRAINT "agents_shift_minutes_valid" CHECK (
    "shift_start_minute" BETWEEN 0 AND 1439 AND "shift_end_minute" BETWEEN 0 AND 1439
  )
);
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");
CREATE INDEX "agents_status_idx" ON "agents"("status");

CREATE TABLE "agent_skills" (
  "agent_id" UUID NOT NULL,
  "skill" TEXT NOT NULL,
  "proficiency" INTEGER NOT NULL,
  CONSTRAINT "agent_skills_pkey" PRIMARY KEY ("agent_id", "skill"),
  CONSTRAINT "agent_skills_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "agent_skills_skill_idx" ON "agent_skills"("skill");

CREATE TABLE "queues" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "priority_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "first_response_sla_minutes" INTEGER NOT NULL,
  "resolution_sla_minutes" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "queues_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "queues_name_key" ON "queues"("name");

CREATE TABLE "queue_required_skills" (
  "queue_id" UUID NOT NULL,
  "skill" TEXT NOT NULL,
  CONSTRAINT "queue_required_skills_pkey" PRIMARY KEY ("queue_id", "skill"),
  CONSTRAINT "queue_required_skills_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "queues"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "queue_required_skills_skill_idx" ON "queue_required_skills"("skill");

CREATE TABLE "tickets" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "queue_id" UUID NOT NULL,
  "assigned_agent_id" UUID,
  "priority" "TicketPriority" NOT NULL DEFAULT 'P3',
  "status" "TicketStatus" NOT NULL DEFAULT 'new',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "first_response_due_at" TIMESTAMPTZ(3) NOT NULL,
  "sla_due_at" TIMESTAMPTZ(3) NOT NULL,
  "first_response_at" TIMESTAMPTZ(3),
  "resolved_at" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tickets_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "queues"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "tickets_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "tickets_status_created_at_idx" ON "tickets"("status", "created_at");
CREATE INDEX "tickets_status_sla_due_at_idx" ON "tickets"("status", "sla_due_at");
CREATE INDEX "tickets_assigned_agent_id_status_idx" ON "tickets"("assigned_agent_id", "status");
CREATE INDEX "tickets_queue_id_status_created_at_idx" ON "tickets"("queue_id", "status", "created_at");

CREATE TABLE "ticket_required_skills" (
  "ticket_id" UUID NOT NULL,
  "skill" TEXT NOT NULL,
  CONSTRAINT "ticket_required_skills_pkey" PRIMARY KEY ("ticket_id", "skill"),
  CONSTRAINT "ticket_required_skills_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ticket_required_skills_skill_idx" ON "ticket_required_skills"("skill");

CREATE TABLE "assignment_history" (
  "id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "agent_id" UUID,
  "from_agent_id" UUID,
  "action" "AssignmentAction" NOT NULL,
  "strategy" TEXT,
  "actor" TEXT NOT NULL DEFAULT 'system',
  "reason" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assignment_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assignment_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "assignment_history_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "assignment_history_ticket_id_created_at_idx" ON "assignment_history"("ticket_id", "created_at");
CREATE INDEX "assignment_history_agent_id_created_at_idx" ON "assignment_history"("agent_id", "created_at");

CREATE TABLE "outbox_events" (
  "id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_at" TIMESTAMPTZ(3),
  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "outbox_events_status_created_at_idx" ON "outbox_events"("status", "created_at");
