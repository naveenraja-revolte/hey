import Link from 'next/link';
import { LearningDiagram } from '@/components/learning-diagram';

export function HeroSection() {
  return (
    <section
      aria-labelledby="page-title"
      className="from-primary/10 via-background to-accent/10 bg-gradient-to-br"
      id="how-it-works"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 sm:py-24 lg:grid-cols-2">
        <div className="motion-safe:animate-fade-up">
          <p className="text-primary text-sm font-semibold tracking-[0.12em] uppercase">
            A plain-language guide
          </p>
          <h1
            className="font-heading text-foreground mt-4 max-w-2xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl"
            id="page-title"
          >
            Machines learn from examples. Their impact is up to us.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-prose text-base leading-7">
            Machine learning is a way for computers to find patterns in data and use them to make
            predictions. It already supports familiar tools—and it works best when people understand
            what it can and cannot do.
          </p>
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring focus-visible:ring-offset-background mt-8 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
            href="#impact"
          >
            Explore the impact
          </Link>
        </div>
        <div className="motion-safe:animate-fade-up motion-safe:delay-100">
          <LearningDiagram />
        </div>
      </div>
    </section>
  );
}
