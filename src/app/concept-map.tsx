export default function ConceptMap() {
  return (
    <section
      id="concept-map"
      aria-labelledby="concept-map-title"
      className="rounded-container border-border bg-card scroll-mt-8 border p-6 md:p-8"
    >
      <h2
        id="concept-map-title"
        className="font-heading text-card-foreground text-2xl font-semibold"
      >
        How the ideas fit
      </h2>
      <p className="text-muted-foreground mt-2 text-base leading-7">
        Each inner idea is one approach within the one around it.
      </p>
      <div className="rounded-control border-primary/30 bg-primary/5 mt-6 border p-5">
        <p className="text-primary text-sm font-semibold tracking-widest uppercase">
          Artificial intelligence
        </p>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          The broad field of making computers perform tasks that usually need human judgment.
        </p>
        <div className="rounded-control border-secondary/50 bg-secondary/10 mt-5 border p-4">
          <p className="text-foreground text-sm font-semibold tracking-widest uppercase">
            Machine learning
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            A way to build AI: models learn patterns from examples rather than following only
            hand-written rules.
          </p>
          <div className="rounded-control border-accent/30 bg-card mt-4 border p-4">
            <p className="text-foreground text-sm font-semibold tracking-widest uppercase">
              Deep learning
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              A type of machine learning that uses layered neural networks to learn complex
              patterns.
            </p>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground mt-5 text-sm font-medium">
        AI is the umbrella. ML sits inside it. Deep learning sits inside ML.
      </p>
    </section>
  );
}
