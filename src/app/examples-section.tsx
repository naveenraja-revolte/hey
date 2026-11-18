const examples = [
  {
    title: 'Email filtering',
    category: 'LANGUAGE',
    description:
      'A model can learn clues in messages that often indicate spam, then flag new messages for review.',
  },
  {
    title: 'Recommendations',
    category: 'PERSONALIZATION',
    description:
      'A service can use patterns in viewing or listening history to suggest something you may enjoy.',
  },
  {
    title: 'Image recognition',
    category: 'VISION',
    description:
      'A model trained on labeled pictures can learn visual patterns and sort new images into categories.',
  },
];

export default function ExamplesSection() {
  return (
    <section id="examples" className="border-border scroll-mt-8 border-t py-16 md:py-20">
      <div className="max-w-2xl">
        <p className="text-primary text-sm font-semibold tracking-widest uppercase">
          In everyday life
        </p>
        <h2 className="font-heading text-foreground mt-3 text-3xl leading-9 tracking-tight">
          You have probably used ML today
        </h2>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          These systems do different jobs, but each uses patterns from data to help with a specific
          task.
        </p>
      </div>
      {examples.length === 0 ? (
        <p className="text-muted-foreground mt-10 text-base leading-7">
          Everyday examples are not available right now.
        </p>
      ) : (
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {examples.map((example) => (
            <li key={example.title} className="rounded-container border-border bg-card border p-6">
              <p className="text-primary text-xs font-semibold tracking-widest">
                {example.category}
              </p>
              <h3 className="font-heading text-card-foreground mt-4 text-xl font-semibold">
                {example.title}
              </h3>
              <p className="text-muted-foreground mt-3 text-base leading-7">
                {example.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
