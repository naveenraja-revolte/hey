import { impactBenefits, impactTradeoffs } from '@/lib/page-content';

export function ImpactSection() {
  return (
    <section aria-labelledby="impact-title" className="bg-card" id="impact">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-primary text-sm font-semibold tracking-[0.12em] uppercase">
            The bigger picture
          </p>
          <h2
            className="font-heading text-card-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
            id="impact-title"
          >
            Useful, with trade-offs.
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-7">
            Machine learning can extend what people do, but it also carries the choices and limits
            of the data and systems behind it.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <ImpactList
            description="Where it can help"
            items={impactBenefits}
            title="More helpful tools"
          />
          <ImpactList
            description="What needs attention"
            items={impactTradeoffs}
            title="Real-world risks"
          />
        </div>

        <div className="rounded-container border-primary/20 bg-primary/5 mt-8 border p-6 sm:p-8">
          <h3 className="font-heading text-foreground text-xl font-semibold">
            Good use keeps people in the loop.
          </h3>
          <p className="text-muted-foreground mt-3 max-w-3xl text-base leading-7">
            Check results across different people and situations, protect personal data, and make
            sure someone can question or correct an important decision. A prediction should inform
            judgment—not replace it.
          </p>
        </div>
      </div>
    </section>
  );
}

function ImpactList({
  description,
  items,
  title,
}: {
  description: string;
  items: string[];
  title: string;
}) {
  return (
    <article className="rounded-container border-border bg-background border p-6 sm:p-8">
      <p className="text-muted-foreground text-sm font-medium">{description}</p>
      <h3 className="font-heading text-foreground mt-2 text-xl font-semibold">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li className="text-foreground flex gap-3 text-base leading-7" key={item}>
              <span aria-hidden="true" className="bg-primary mt-2 size-2 shrink-0 rounded-full" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-6 text-base leading-7">No points to show yet.</p>
      )}
    </article>
  );
}
