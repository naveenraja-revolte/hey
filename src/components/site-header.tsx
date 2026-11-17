import Link from 'next/link';
import { pageSections } from '@/lib/page-content';

export function SiteHeader() {
  return (
    <header className="border-border/80 bg-card border-b">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link
          aria-label="Machine learning, explained — home"
          className="rounded-control font-heading text-foreground hover:text-primary focus-visible:ring-ring min-h-11 shrink-0 content-center text-lg font-semibold tracking-tight transition-colors outline-none focus-visible:ring-2"
          href="#top"
        >
          Machine learning
        </Link>
        <nav aria-label="Page sections" className="flex max-w-full gap-2 overflow-x-auto">
          {pageSections.map((section) => (
            <Link
              className="rounded-control text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring min-h-11 shrink-0 content-center px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
              href={section.href}
              key={section.href}
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
