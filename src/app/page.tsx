import { redirect } from 'next/navigation';
import { getCurrentViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    redirect('/login');
  }

  if (viewer.role === 'pending') {
    redirect('/pending');
  }

  redirect('/tickets');
}
