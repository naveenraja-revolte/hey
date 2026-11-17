import { applications } from '@/lib/page-content';

export function ApplicationsSection() {
  return (
    <section aria-labelledby="applications-title" className="bg-background" id="everyday-use">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-primary text-sm font-semibold tracking-[0.12em] uppercase">
            Already around us
          </p>
          <h2
            className="font-heading text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
            id="applications-title"
          >
            A familiar technology, in many places.
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-7">
            These systems often work quietly in the background, helping sort, suggest, detect, or
            estimate.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {applications.length > 0 ? (
            applications.map((application, index) => (
              <article
                className="motion-safe:animate-fade-up rounded-container border-border bg-card border p-6 transition-shadow hover:shadow-sm"
                key={application.title}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <p className="font-heading text-primary text-sm font-semibold">0{index + 1}</p>
                <h3 className="font-heading text-card-foreground mt-4 text-xl font-semibold">
                  {application.title}
                </h3>
                <p className="text-muted-foreground mt-3 text-base leading-7">
                  {application.detail}
                </p>
              </article>
            ))
          ) : (
            <p className="text-muted-foreground rounded-container border-border bg-card border p-6 text-base leading-7 sm:col-span-2 lg:col-span-4">
              There are no examples to show yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
