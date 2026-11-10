import { prisma } from "./db.js";

export async function getMetricsSummary() {
  const [queueDepths, waitRows, breachRows, utilizationRows] = await Promise.all([
    prisma.$queryRaw<Array<{ queueId: string; queueName: string; depth: bigint }>>`
      SELECT q.id AS "queueId", q.name AS "queueName", COUNT(t.id)::bigint AS depth
      FROM queues q
      LEFT JOIN tickets t
        ON t.queue_id = q.id
        AND t.assigned_agent_id IS NULL
        AND t.status IN ('new', 'escalated')
      GROUP BY q.id, q.name
      ORDER BY q.name ASC
    `,
    prisma.$queryRaw<Array<{ averageWaitMinutes: number | null }>>`
      SELECT COALESCE(
        AVG(EXTRACT(EPOCH FROM (first_assignment.first_assigned_at - t.created_at)) / 60),
        0
      )::double precision AS "averageWaitMinutes"
      FROM tickets t
      JOIN (
        SELECT ticket_id, MIN(created_at) AS first_assigned_at
        FROM assignment_history
        WHERE action IN ('assigned', 'manual_override')
        GROUP BY ticket_id
      ) first_assignment ON first_assignment.ticket_id = t.id
    `,
    prisma.$queryRaw<Array<{ total: bigint; breached: bigint }>>`
      SELECT
        COUNT(*)::bigint * 2 AS total,
        (
          COUNT(*) FILTER (
            WHERE (first_response_at IS NULL AND first_response_due_at < NOW())
              OR first_response_at > first_response_due_at
          ) +
          COUNT(*) FILTER (
            WHERE (status = 'resolved' AND resolved_at > sla_due_at)
              OR (status <> 'resolved' AND sla_due_at < NOW())
          )
        )::bigint AS breached
      FROM tickets
    `,
    prisma.$queryRaw<Array<{ averageUtilization: number | null; loadStdDev: number | null }>>`
      WITH agent_loads AS (
        SELECT
          a.id,
          a.max_concurrent,
          COUNT(t.id) FILTER (
            WHERE t.status IN ('assigned', 'in_progress', 'escalated')
          )::double precision AS active_load
        FROM agents a
        LEFT JOIN tickets t ON t.assigned_agent_id = a.id
        GROUP BY a.id, a.max_concurrent
      )
      SELECT
        COALESCE(AVG(active_load / max_concurrent), 0)::double precision AS "averageUtilization",
        COALESCE(STDDEV_POP(active_load), 0)::double precision AS "loadStdDev"
      FROM agent_loads
    `,
  ]);

  const total = Number(breachRows[0]?.total ?? 0n);
  const breached = Number(breachRows[0]?.breached ?? 0n);

  return {
    queueDepth: queueDepths.map(({ queueId, queueName, depth }) => ({
      queueId,
      queueName,
      depth: Number(depth),
    })),
    averageWaitMinutes: Number(waitRows[0]?.averageWaitMinutes ?? 0),
    slaBreachRate: total === 0 ? 0 : breached / total,
    agentUtilization: Number(utilizationRows[0]?.averageUtilization ?? 0),
    loadFairnessStdDev: Number(utilizationRows[0]?.loadStdDev ?? 0),
  };
}
