import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { verifySessionToken } from '@/lib/auth';

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (verifySessionToken(cookieStore.get('dispatch_session')?.value)) redirect('/deliveries');

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
      <section className="rounded-container border-border bg-card w-full space-y-6 border p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-primary text-sm font-medium">Dispatch Desk</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            Sign in to dispatch
          </h1>
          <p className="text-muted-foreground text-pretty">
            Use your configured staff credentials to manage deliveries.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
