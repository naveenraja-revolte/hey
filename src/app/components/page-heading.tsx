import Link from 'next/link';

export function PageHeading({ title, description, action }: { title: string; description?: string; action?: { href: string; label: string } }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground text-pretty">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="inline-flex min-h-11 items-center rounded-control bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring">
          {action.label}
        </Link>
      )}
    </header>
  );
}
