'use client';

import Link from 'next/link';
import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBoardAction } from '@/actions/board-actions';
import { SignOutButton } from '@/components/sign-out-button';
import type { BoardSummary } from '@/services/board-service';

interface BoardHomeProps {
  boards: BoardSummary[];
  name: string;
}

export function BoardHome({ boards, name }: BoardHomeProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [boardTitle, setBoardTitle] = useState('');

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    startTransition(async () => {
      const result = await createBoardAction({ title: boardTitle });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/boards/${result.data.boardId}`);
      router.refresh();
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link aria-label="Fieldnotes home" className="brand-lockup" href="/boards">
          <span aria-hidden="true" className="brand-mark">
            F
          </span>
          <span>Fieldnotes</span>
        </Link>
        <div className="topbar-actions">
          <span className="user-greeting">{name}</span>
          <SignOutButton />
        </div>
      </header>

      <section className="home-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>Your boards</h1>
            <p className="section-intro">A clear place for the work you want to move forward.</p>
          </div>
          <span className="board-count">
            {boards.length} {boards.length === 1 ? 'board' : 'boards'}
          </span>
        </div>

        {boards.length === 0 ? (
          <section className="empty-state">
            <span aria-hidden="true" className="empty-mark">
              01
            </span>
            <p className="eyebrow">START WITH ONE PROJECT</p>
            <h2>Give your next idea a place to land.</h2>
            <p>Create a board, add a few tasks, and move them along as you work.</p>
          </section>
        ) : (
          <div className="board-grid">
            {boards.map((board) => (
              <Link className="board-tile" href={`/boards/${board.id}`} key={board.id}>
                <span className="board-tile-marker" aria-hidden="true" />
                <span className="board-tile-title">{board.title}</span>
                <span className="board-tile-meta">
                  {board.columnCount} {board.columnCount === 1 ? 'column' : 'columns'}
                </span>
                <span aria-hidden="true" className="board-tile-arrow">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        )}

        <form className="create-board-form" onSubmit={handleCreate}>
          <label className="field-label" htmlFor="new-board-title">
            Create a board
          </label>
          <div className="inline-form-row">
            <input
              className="text-input"
              id="new-board-title"
              maxLength={80}
              onChange={(event) => setBoardTitle(event.target.value)}
              placeholder="e.g. Spring launch"
              required
              value={boardTitle}
            />
            <button className="button button-primary" disabled={pending} type="submit">
              {pending ? 'Creating…' : 'Create board'}
            </button>
          </div>
          {error ? (
            <p className="form-message form-message-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
