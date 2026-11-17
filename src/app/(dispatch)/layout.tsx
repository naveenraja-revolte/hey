import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { verifySessionToken } from '@/lib/auth';

export default async function DispatchLayout({ children }: LayoutProps<'/'>) {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get('dispatch_session')?.value)) redirect('/login');
  return <AppShell>{children}</AppShell>;
}
