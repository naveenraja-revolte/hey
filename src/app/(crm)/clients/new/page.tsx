import { PageHeading } from '@/app/components/page-heading';
import { ClientForm } from '@/app/components/client-form';

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading title="Add client" description="Save contact details and notes for a person or company you work with." />
      <ClientForm />
    </div>
  );
}
