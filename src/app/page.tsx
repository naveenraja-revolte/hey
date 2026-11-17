import Link from 'next/link';
import { ApplicationsSection } from '@/components/applications-section';
import { HeroSection } from '@/components/hero-section';
import { ImpactSection } from '@/components/impact-section';
import { SiteHeader } from '@/components/site-header';

export default function Home() {
  return (
    <div id="top" className="min-h-screen">
      <SiteHeader />
      <main>
        <HeroSection />
        <ApplicationsSection />
        <ImpactSection />
      </main>
      <footer className="border-border bg-background border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="text-muted-foreground text-sm">Machine learning, in plain language.</p>
          <Link
            className="rounded-control text-primary hover:bg-muted focus-visible:ring-ring min-h-11 content-center px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
            href="#top"
          >
            Back to top
          </Link>
        </div>
      </footer>
    </div>
  );
}
