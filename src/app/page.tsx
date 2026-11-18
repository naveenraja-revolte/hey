import { ContactForm } from '@/components/contact-form';

export default function Home() {
  return (
    <>
      <a
        className="focus:rounded-control focus:bg-card focus:text-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:px-4 focus:py-3 focus:ring-2"
        href="#main"
      >
        Skip to content
      </a>
      <main
        className="mx-auto grid min-h-screen w-full max-w-3xl content-center px-4 py-12 sm:px-8"
        id="main"
      >
        <section className="animate-enter rounded-container border-border border-t-primary bg-card ring-foreground/10 border border-t-4 p-6 shadow-md ring-1 sm:p-10">
          <header className="mb-8 space-y-3">
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight text-balance">
              Get in touch
            </h1>
            <p className="text-muted-foreground max-w-prose text-base leading-7 text-pretty">
              Share a few details and we’ll be in touch soon.
            </p>
          </header>
          <ContactForm />
        </section>
      </main>
    </>
  );
}
