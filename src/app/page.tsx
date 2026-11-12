import Calculator from '@/components/calculator';

export default function Home() {
  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">A little clarity, calculated</p>
        <h1>Everyday calculator</h1>
        <p className="page-intro">Quick arithmetic, without the noise.</p>
      </header>
      <Calculator />
      <footer className="page-footer">
        <span>Private by design</span>
        <span>Nothing is saved</span>
      </footer>
    </main>
  );
}
