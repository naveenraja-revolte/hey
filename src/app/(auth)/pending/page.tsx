import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/app/actions/auth';
import { getCurrentViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

export default async function PendingApprovalPage() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    redirect('/login');
  }

  if (viewer.role !== 'pending') {
    redirect('/tickets');
  }

  return (
    <section className="auth-card pending-card">
      <div className="brand-lockup">
        <span aria-hidden="true" className="brand-mark">D</span>
        <span>Dispatch Desk</span>
      </div>
      <span className="eyebrow">Account awaiting placement</span>
      <h1>You’re nearly there.</h1>
      <p className="auth-intro">
        Your account is ready, but a team administrator needs to place you on a team before you can see or work with tickets.
      </p>
      <div className="pending-note">
        <strong>What happens next?</strong>
        <p>Contact your administrator and ask them to add {viewer.email} to the right team. Sign in again after they do.</p>
      </div>
      <form action={signOutAction}>
        <button className="button button-secondary button-full" type="submit">Sign out</button>
      </form>
      <Link className="text-link pending-refresh" href="/">Check access again</Link>
    </section>
  );
}
