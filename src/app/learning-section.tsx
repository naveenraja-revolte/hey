const learningSteps = [
  {
    number: '01',
    title: 'Gather examples',
    description: 'Provide examples that show the task, such as emails marked as spam or not spam.',
  },
  {
    number: '02',
    title: 'Find patterns',
    description:
      'A learning algorithm adjusts a model so it can recognize patterns in those examples.',
  },
  {
    number: '03',
    title: 'Make a prediction',
    description:
      'The trained model applies what it learned to new input. Its answer is a prediction, not a guarantee.',
  },
];

export default function LearningSection() {
  return (
    <section id="learning" className="border-border scroll-mt-8 border-t py-16 md:py-20">
      <div className="max-w-2xl">
        <p className="text-primary text-sm font-semibold tracking-widest uppercase">
          How it learns
        </p>
        <h2 className="font-heading text-foreground mt-3 text-3xl leading-9 tracking-tight">
          From examples to a useful guess
        </h2>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          In machine learning, people choose the goal and provide data. The algorithm uses that data
          to adjust a model, which can then make predictions on examples it has not seen before.
        </p>
      </div>
      {learningSteps.length === 0 ? (
        <p className="text-muted-foreground mt-10 text-base leading-7">
          Learning steps are not available right now.
        </p>
      ) : (
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {learningSteps.map((step) => (
            <li key={step.number} className="rounded-container border-border bg-card border p-6">
              <span className="text-primary font-mono text-sm font-semibold">{step.number}</span>
              <h3 className="font-heading text-card-foreground mt-5 text-xl font-semibold">
                {step.title}
              </h3>
              <p className="text-muted-foreground mt-3 text-base leading-7">{step.description}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
