import { LeadForm } from '@/app/components/lead-form';
import { PageHeading } from '@/app/components/page-heading';

export default function NewLeadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading title="Add lead" description="Capture a prospect and the source of the opportunity." />
      <LeadForm />
    </div>
  );
}
