import { learningStages } from '@/lib/page-content';

export function LearningDiagram() {
  return (
    <figure
      aria-labelledby="learning-diagram-title"
      className="rounded-container border-border bg-card border p-6 shadow-sm sm:p-8"
    >
      <figcaption
        className="text-muted-foreground mb-6 text-sm font-semibold tracking-[0.12em] uppercase"
        id="learning-diagram-title"
      >
        A simple learning loop
      </figcaption>
      <ol className="space-y-3">
        {learningStages.length > 0 ? (
          learningStages.map((stage) => (
            <li className="flex items-center gap-4" key={stage.number}>
              <span className="bg-primary/10 font-heading text-primary flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                {stage.number}
              </span>
              <div className="rounded-control border-border bg-background min-w-0 flex-1 border px-4 py-3">
                <h3 className="font-heading text-card-foreground text-lg font-semibold">
                  {stage.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-base leading-7">{stage.detail}</p>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-control border-border bg-background text-muted-foreground border px-4 py-3 text-base leading-7">
            There are no learning steps to show yet.
          </li>
        )}
      </ol>
      <p className="border-border text-muted-foreground mt-6 border-t pt-5 text-base leading-7">
        It finds patterns, not meaning. People still need to check whether a prediction makes sense.
      </p>
    </figure>
  );
}
