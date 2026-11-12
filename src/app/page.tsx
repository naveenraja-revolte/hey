import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth-session';

export default async function HomePage() {
  const session = await getCurrentSession();
  if (session) redirect('/boards');

  return (
    <main className="landing-shell">
      <header className="topbar landing-topbar">
        <Link aria-label="Fieldnotes home" className="brand-lockup" href="/">
          <span aria-hidden="true" className="brand-mark">
            F
          </span>
          <span>Fieldnotes</span>
        </Link>
        <nav aria-label="Account" className="topbar-actions">
          <Link className="button button-quiet" href="/login">
            Sign in
          </Link>
          <Link className="button button-primary" href="/signup">
            Create account
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">A QUIETER WAY TO KEEP THINGS MOVING</p>
          <h1>A board for the work you carry.</h1>
          <p className="landing-description">
            Catch the next step, give it a place, and move it forward when you’re ready. Your boards
            stay yours.
          </p>
          <div className="landing-actions">
            <Link className="button button-primary button-large" href="/signup">
              Create your first board
            </Link>
            <Link className="text-link" href="/login">
              I already have an account <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="landing-footnote">Private by default · No team setup required</p>
        </div>

        <div
          aria-label="Example project board with tasks in three workflow columns"
          className="hero-board-preview"
        >
          <div className="preview-heading">
            <span className="preview-dot" aria-hidden="true" />
            <span>FIELD NOTES / PROJECT 01</span>
            <span className="preview-date">THIS WEEK</span>
          </div>
          <div className="preview-columns">
            <div className="preview-column">
              <div className="preview-column-title">
                <span className="column-dot column-dot-0" />
                To Do <span>02</span>
              </div>
              <div className="preview-task">
                <span className="preview-task-rail rail-ochre" />
                <span>Gather the first ideas</span>
                <small>LOW</small>
              </div>
              <div className="preview-task">
                <span className="preview-task-rail rail-terra" />
                <span>Choose a direction</span>
                <small>HIGH</small>
              </div>
            </div>
            <div className="preview-column">
              <div className="preview-column-title">
                <span className="column-dot column-dot-1" />
                In Progress <span>01</span>
              </div>
              <div className="preview-task">
                <span className="preview-task-rail rail-moss" />
                <span>Draft the outline</span>
                <small>TODAY</small>
              </div>
            </div>
            <div className="preview-column preview-column-complete">
              <div className="preview-column-title">
                <span className="column-dot column-dot-2" />
                Done <span>01</span>
              </div>
              <div className="preview-task">
                <span className="preview-task-rail rail-moss" />
                <span>Make room to focus</span>
                <small>DONE</small>
              </div>
            </div>
          </div>
          <div className="preview-footer">
            <span>One step at a time.</span>
            <span className="preview-footer-mark">FIELDNOTES / 01</span>
          </div>
        </div>
      </section>
      <footer className="landing-footer">
        <span>FIELDNOTES</span>
        <span>Personal work, kept in order.</span>
      </footer>
    </main>
  );
}
