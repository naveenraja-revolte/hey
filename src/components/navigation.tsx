'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  { href: '/deliveries', label: 'Deliveries' },
  { href: '/couriers', label: 'Couriers' },
];

function SectionLinks({ pathname }: { pathname: string }) {
  return sections.map((section) => {
    const active = pathname.startsWith(section.href);
    return (
      <Link
        key={section.href}
        href={section.href}
        aria-current={active ? 'page' : undefined}
        className={`focus-visible:outline-ring flex min-h-11 items-center border-l-2 px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
          active
            ? 'border-primary bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground border-transparent'
        }`}
      >
        {section.label}
      </Link>
    );
  });
}

export function Navigation() {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-2 sm:flex">
        <SectionLinks pathname={pathname} />
      </nav>
      <details className="relative sm:hidden">
        <summary className="rounded-control border-border focus-visible:outline-ring flex min-h-11 cursor-pointer list-none items-center border px-3 text-sm font-medium focus-visible:outline-2">
          Menu
        </summary>
        <nav
          aria-label="Primary"
          className="rounded-container border-border bg-card absolute top-full right-0 z-20 mt-2 min-w-40 border p-2 shadow-lg"
        >
          <SectionLinks pathname={pathname} />
        </nav>
      </details>
    </>
  );
}
