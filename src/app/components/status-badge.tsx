import { leadStatuses, projectStatuses } from '@/lib/domain';

type StatusBadgeProps = { status: string };

const success = 'bg-success/10 text-success';
const warning = 'bg-warning/10 text-warning';
const info = 'bg-info/10 text-info';
const muted = 'bg-muted text-muted-foreground';
const danger = 'bg-destructive/10 text-destructive';

const statusColors: Record<string, string> = {
  New: info,
  Contacted: warning,
  Qualified: success,
  Negotiation: warning,
  Converted: success,
  Lost: danger,
  Planned: info,
  Active: success,
  'On hold': warning,
  Completed: muted,
  Cancelled: danger,
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const validStatus = [...leadStatuses, ...projectStatuses].includes(status as never);
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold ${validStatus ? statusColors[status] : muted}`}>
      {status}
    </span>
  );
}
