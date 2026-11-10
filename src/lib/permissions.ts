import type { Viewer } from '@/lib/viewer';

export function canViewTicket(
  viewer: Viewer,
  ticket: { assigneeId: string },
): boolean {
  return viewer.role === 'admin' || (viewer.role === 'member' && ticket.assigneeId === viewer.id);
}

export function canUpdateTicketStatus(
  viewer: Viewer,
  ticket: { assigneeId: string },
): boolean {
  return viewer.role === 'member' && ticket.assigneeId === viewer.id;
}
