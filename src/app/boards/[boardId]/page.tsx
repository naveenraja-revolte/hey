import { notFound, redirect } from 'next/navigation';
import { BoardWorkspace } from '@/components/board-workspace';
import { getCurrentSession } from '@/lib/auth-session';
import { getBoardForUser } from '@/services/board-service';

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { boardId } = await params;
  const board = await getBoardForUser(session.user.id, boardId);
  if (!board) notFound();

  return <BoardWorkspace board={board} name={session.user.name} />;
}
