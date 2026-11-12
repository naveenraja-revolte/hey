import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BoardHome } from '@/components/board-home';
import { listBoardsForUser } from '@/services/board-service';
import { getCurrentSession } from '@/lib/auth-session';

export const metadata: Metadata = { title: 'Your boards' };

export default async function BoardsPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const boards = await listBoardsForUser(session.user.id);
  return <BoardHome boards={boards} name={session.user.name} />;
}
