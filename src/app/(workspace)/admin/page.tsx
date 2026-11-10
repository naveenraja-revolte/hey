import type { Metadata } from 'next';
import { AdminConsole } from '@/components/admin-console';
import { requireAdminViewer } from '@/lib/viewer';
import { getAdminData } from '@/services/admin.service';

export const metadata: Metadata = {
  title: 'Administration · Dispatch Desk',
};

export default async function AdminPage() {
  await requireAdminViewer();
  const data = getAdminData();

  return (
    <section className="page-section">
      <div className="page-heading">
        <span className="eyebrow">Workspace administration</span>
        <h1>Keep routing on track.</h1>
        <p>Manage team membership and the topics that guide automatic assignment.</p>
      </div>
      <AdminConsole data={data} />
    </section>
  );
}
