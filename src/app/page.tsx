import ExamplesSection from './examples-section';
import LearningSection from './learning-section';
import ConceptMap from './concept-map';

export default function Home() {
  return (
    <>
      <header className="border-border/80 bg-background/90 border-b">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <a
            href="#top"
            className="font-heading text-foreground text-xl font-semibold tracking-tight"
          >
            AI &amp; ML field guide
          </a>
          <nav aria-label="Main navigation" className="flex gap-6 text-sm font-medium">
            <a className="hover:text-primary transition-colors" href="#concept-map">
              The relationship
            </a>
            <a className="hover:text-primary transition-colors" href="#learning">
              How it learns
            </a>
            <a className="hover:text-primary transition-colors" href="#examples">
              Everyday examples
            </a>
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto w-full max-w-6xl px-6">
        <section className="grid gap-12 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24">
          <div className="animate-enter">
            <h1 className="font-heading text-foreground max-w-xl text-5xl leading-[52px] tracking-tight">
              A clearer way to understand AI.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-8">
              Artificial intelligence is the big idea. Machine learning is one of the ways computers
              get better at a task by learning from examples. Here is how the pieces fit together.
            </p>
            <a
              href="#concept-map"
              className="rounded-control bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring mt-8 inline-flex min-h-12 items-center justify-center px-6 font-semibold transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
            >
              Explore the concepts
            </a>
          </div>
          <div className="animate-enter [animation-delay:80ms]">
            <ConceptMap />
          </div>
        </section>

        <LearningSection />
        <ExamplesSection />

        <aside className="rounded-container border-primary/20 bg-primary/5 mb-16 border p-6 md:mb-20 md:p-8">
          <h2 className="font-heading text-foreground text-2xl font-semibold">
            A useful thing to remember
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl text-base leading-7">
            A model learns from the data it is given. If that data is incomplete or biased, its
            predictions can be too. Treat an AI-generated answer as a starting point to check, not
            automatically as a fact.
          </p>
        </aside>
      </main>

      <footer className="border-border mt-auto border-t">
        <div className="text-muted-foreground mx-auto max-w-6xl px-6 py-6 text-sm">
          A concise introduction to artificial intelligence and machine learning.
        </div>
      </footer>
    </>
  );
}
