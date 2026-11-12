'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteBoardAction, updateBoardAction } from '@/actions/board-actions';
import {
  createColumnAction,
  deleteColumnAction,
  moveColumnAction,
  renameColumnAction,
} from '@/actions/column-actions';
import { deleteTaskAction, loadMoreTasksAction, moveTaskAction } from '@/actions/task-actions';
import { SignOutButton } from '@/components/sign-out-button';
import { TaskDialog } from '@/components/task-dialog';
import type { Task } from '@/db/schema';
import type { BoardPageData } from '@/services/board-service';

interface BoardWorkspaceProps {
  board: BoardPageData;
  name: string;
}

function dueDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(parsed);
}

export function BoardWorkspace({ board, name }: BoardWorkspaceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tasks, setTasks] = useState(board.tasks);
  const [hasMoreTasks, setHasMoreTasks] = useState(board.hasMoreTasks);
  const [dialogTask, setDialogTask] = useState<Task | null>(null);
  const [dialogColumnId, setDialogColumnId] = useState('');
  const [activeColumnId, setActiveColumnId] = useState(board.columns[0]?.id ?? '');
  const [editingColumnId, setEditingColumnId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [renamingBoard, setRenamingBoard] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [confirmBoardDelete, setConfirmBoardDelete] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState('');

  useEffect(() => {
    setTasks(board.tasks);
    setHasMoreTasks(board.hasMoreTasks);
    setBoardTitle(board.title);
    if (!board.columns.some((column) => column.id === activeColumnId)) {
      setActiveColumnId(board.columns[0]?.id ?? '');
    }
  }, [board, activeColumnId]);

  const tasksByColumn = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const column of board.columns) groups.set(column.id, []);
    for (const task of tasks) groups.get(task.columnId)?.push(task);
    return groups;
  }, [board.columns, tasks]);

  function finishMutation(message: string) {
    setError('');
    setNotice(message);
    router.refresh();
  }

  function showError(message: string) {
    setNotice('');
    setError(message);
  }

  function moveTask(taskId: string, columnId: string) {
    setError('');
    startTransition(async () => {
      const result = await moveTaskAction({
        boardId: board.id,
        taskId,
        targetColumnId: columnId,
      });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      setTasks((current) => {
        const task = current.find((item) => item.id === taskId);
        if (!task || task.columnId === columnId) return current;
        return current.map((item) => (item.id === taskId ? { ...item, columnId } : item));
      });
      finishMutation('Task moved.');
    });
  }

  function handleDrop(event: React.DragEvent<HTMLElement>, columnId: string) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    if (taskId) moveTask(taskId, columnId);
    setDraggedTaskId('');
  }

  function saveBoardTitle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateBoardAction({ boardId: board.id, title: boardTitle });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      setRenamingBoard(false);
      finishMutation('Board name saved.');
    });
  }

  function addColumn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createColumnAction({ boardId: board.id, title: newColumnTitle });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      setNewColumnTitle('');
      setAddingColumn(false);
      finishMutation('Column added.');
    });
  }

  function renameColumn(event: React.FormEvent<HTMLFormElement>, columnId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '');
    startTransition(async () => {
      const result = await renameColumnAction({ boardId: board.id, columnId, title });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      setEditingColumnId('');
      finishMutation('Column name saved.');
    });
  }

  function shiftColumn(columnId: string, direction: 'left' | 'right') {
    startTransition(async () => {
      const result = await moveColumnAction({ boardId: board.id, columnId, direction });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      finishMutation('Column order saved.');
    });
  }

  function removeColumn(columnId: string) {
    startTransition(async () => {
      const result = await deleteColumnAction({ boardId: board.id, columnId });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      finishMutation('Column removed.');
    });
  }

  function removeBoard() {
    startTransition(async () => {
      const result = await deleteBoardAction({ boardId: board.id });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      router.replace('/boards');
      router.refresh();
    });
  }

  function removeTask(taskId: string) {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteTaskAction({ boardId: board.id, taskId });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      setTasks((current) => current.filter((task) => task.id !== taskId));
      finishMutation('Task deleted.');
    });
  }

  function loadMoreTasks() {
    startTransition(async () => {
      const result = await loadMoreTasksAction({ boardId: board.id, offset: tasks.length });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      setTasks((current) => [...current, ...result.data.tasks]);
      setHasMoreTasks(result.data.hasMoreTasks);
    });
  }

  return (
    <main className="app-shell board-shell">
      <header className="topbar">
        <div className="topbar-left">
          <Link aria-label="Back to boards" className="brand-lockup" href="/boards">
            <span aria-hidden="true" className="brand-mark">
              F
            </span>
            <span>Fieldnotes</span>
          </Link>
          <span aria-hidden="true" className="topbar-divider">
            /
          </span>
          <Link className="breadcrumbs-link" href="/boards">
            Boards
          </Link>
        </div>
        <div className="topbar-actions">
          <span className="user-greeting">{name}</span>
          <SignOutButton />
        </div>
      </header>

      <section className="board-content">
        <div className="board-heading">
          <div className="board-heading-main">
            {renamingBoard ? (
              <form className="board-title-form" onSubmit={saveBoardTitle}>
                <label className="sr-only" htmlFor="board-title">
                  Board name
                </label>
                <input
                  autoFocus
                  className="title-input"
                  id="board-title"
                  maxLength={80}
                  onChange={(event) => setBoardTitle(event.target.value)}
                  required
                  value={boardTitle}
                />
                <button
                  className="button button-small button-primary"
                  disabled={pending}
                  type="submit"
                >
                  Save
                </button>
                <button
                  className="button button-small button-quiet"
                  onClick={() => setRenamingBoard(false)}
                  type="button"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <p className="eyebrow">PERSONAL PROJECT</p>
                <h1>{board.title}</h1>
              </>
            )}
            <p className="section-intro">A little progress, made visible.</p>
          </div>
          <div className="board-heading-actions">
            {!renamingBoard ? (
              <button
                className="button button-quiet"
                onClick={() => setRenamingBoard(true)}
                type="button"
              >
                Rename board
              </button>
            ) : null}
            <button
              className="button button-primary"
              onClick={() => {
                setDialogTask(null);
                setDialogColumnId(activeColumnId || board.columns[0]?.id || '');
              }}
              type="button"
            >
              + Add task
            </button>
            <button
              className="button button-quiet danger-text"
              onClick={() => setConfirmBoardDelete(true)}
              type="button"
            >
              Delete board
            </button>
          </div>
        </div>

        {confirmBoardDelete ? (
          <div className="confirm-strip" role="group" aria-label="Confirm board deletion">
            <span>Delete “{board.title}” and all its tasks?</span>
            <button
              className="button button-small button-danger"
              disabled={pending}
              onClick={removeBoard}
              type="button"
            >
              Delete board
            </button>
            <button
              className="button button-small button-quiet"
              onClick={() => setConfirmBoardDelete(false)}
              type="button"
            >
              Keep it
            </button>
          </div>
        ) : null}
        {error ? (
          <p className="status-banner status-banner-error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="status-banner" aria-live="polite">
            {notice}
          </p>
        ) : null}

        <div className="board-summary-line">
          <span>{board.columns.length} workflow stages</span>
          <span className="summary-rule" aria-hidden="true" />
          <span>
            {board.columns.reduce((total, column) => total + column.taskCount, 0)} tasks in this
            project
          </span>
        </div>

        <div aria-label="Board columns" className="mobile-column-tabs" role="tablist">
          {board.columns.map((column) => (
            <button
              aria-selected={activeColumnId === column.id}
              className={`mobile-column-tab ${activeColumnId === column.id ? 'is-selected' : ''}`}
              key={column.id}
              onClick={() => setActiveColumnId(column.id)}
              role="tab"
              type="button"
            >
              {column.title}
              <span>{column.taskCount}</span>
            </button>
          ))}
        </div>

        <div className="board-columns">
          {board.columns.map((column, index) => (
            <section
              aria-label={`${column.title} column`}
              className={`board-column ${activeColumnId !== column.id ? 'mobile-hidden' : ''}`}
              key={column.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, column.id)}
              role="tabpanel"
            >
              <header className="column-header">
                {editingColumnId === column.id ? (
                  <form
                    className="column-edit-form"
                    onSubmit={(event) => renameColumn(event, column.id)}
                  >
                    <label className="sr-only" htmlFor={`column-${column.id}`}>
                      Column name
                    </label>
                    <input
                      autoFocus
                      className="column-name-input"
                      defaultValue={column.title}
                      id={`column-${column.id}`}
                      maxLength={40}
                      name="title"
                      required
                    />
                    <button
                      aria-label={`Save ${column.title} name`}
                      className="icon-button"
                      disabled={pending}
                      type="submit"
                    >
                      ✓
                    </button>
                    <button
                      aria-label="Cancel rename"
                      className="icon-button"
                      onClick={() => setEditingColumnId('')}
                      type="button"
                    >
                      ×
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="column-title-block">
                      <span className={`column-dot column-dot-${index % 3}`} aria-hidden="true" />
                      <h2>{column.title}</h2>
                      <span className="column-count">{column.taskCount}</span>
                    </div>
                    <div className="column-tools">
                      <button
                        aria-label={`Move ${column.title} left`}
                        className="icon-button"
                        disabled={pending || index === 0}
                        onClick={() => shiftColumn(column.id, 'left')}
                        type="button"
                      >
                        ←
                      </button>
                      <button
                        aria-label={`Move ${column.title} right`}
                        className="icon-button"
                        disabled={pending || index === board.columns.length - 1}
                        onClick={() => shiftColumn(column.id, 'right')}
                        type="button"
                      >
                        →
                      </button>
                      <button
                        aria-label={`Rename ${column.title}`}
                        className="icon-button"
                        disabled={pending}
                        onClick={() => setEditingColumnId(column.id)}
                        type="button"
                      >
                        ✎
                      </button>
                      <button
                        aria-label={`Remove ${column.title}`}
                        className="icon-button"
                        disabled={pending}
                        onClick={() => removeColumn(column.id)}
                        type="button"
                      >
                        −
                      </button>
                    </div>
                  </>
                )}
              </header>

              <div className="column-task-list">
                {(tasksByColumn.get(column.id) ?? []).map((task) => (
                  <article
                    className={`task-card ${draggedTaskId === task.id ? 'is-dragging' : ''}`}
                    draggable
                    key={task.id}
                    onDragEnd={() => setDraggedTaskId('')}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', task.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggedTaskId(task.id);
                    }}
                  >
                    <div className="task-card-topline">
                      <span className={`priority-mark priority-${task.priority}`}>
                        {task.priority}
                      </span>
                      <button
                        aria-label={`Edit task ${task.title}`}
                        className="task-edit-button"
                        onClick={() => {
                          setDialogTask(task);
                          setDialogColumnId(task.columnId);
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                    </div>
                    <h3>{task.title}</h3>
                    {task.description ? (
                      <p className="task-description">{task.description}</p>
                    ) : null}
                    <div className="task-card-footer">
                      <span className="assignee-chip">
                        <span aria-hidden="true">●</span> You
                      </span>
                      {task.dueDate ? (
                        <time className="task-due-date" dateTime={task.dueDate}>
                          {dueDateLabel(task.dueDate)}
                        </time>
                      ) : null}
                    </div>
                    <div className="task-card-controls">
                      <label className="sr-only" htmlFor={`move-${task.id}`}>
                        Move {task.title} to another column
                      </label>
                      <select
                        className="task-move-select"
                        id={`move-${task.id}`}
                        onChange={(event) => moveTask(task.id, event.target.value)}
                        value={task.columnId}
                      >
                        {board.columns.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                      <button
                        className="task-delete-button"
                        onClick={() => removeTask(task.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
                {(tasksByColumn.get(column.id) ?? []).length === 0 ? (
                  <p className="column-empty">Nothing here yet. Add a task or move one in.</p>
                ) : null}
                <button
                  className="add-task-inline"
                  onClick={() => {
                    setDialogTask(null);
                    setDialogColumnId(column.id);
                  }}
                  type="button"
                >
                  + Add a task
                </button>
              </div>
            </section>
          ))}
          {addingColumn ? (
            <form className="new-column-form" onSubmit={addColumn}>
              <label className="field-label" htmlFor="new-column-title">
                Column name
              </label>
              <input
                autoFocus
                className="text-input"
                id="new-column-title"
                maxLength={40}
                onChange={(event) => setNewColumnTitle(event.target.value)}
                placeholder="e.g. Ready for review"
                required
                value={newColumnTitle}
              />
              <div className="dialog-actions">
                <button
                  className="button button-small button-quiet"
                  onClick={() => setAddingColumn(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="button button-small button-primary"
                  disabled={pending}
                  type="submit"
                >
                  Add column
                </button>
              </div>
            </form>
          ) : (
            <button
              className="add-column-button"
              onClick={() => setAddingColumn(true)}
              type="button"
            >
              <span aria-hidden="true">+</span> Add a column
            </button>
          )}
        </div>

        {hasMoreTasks ? (
          <div className="load-more-wrap">
            <button
              className="button button-quiet"
              disabled={pending}
              onClick={loadMoreTasks}
              type="button"
            >
              {pending ? 'Loading…' : 'Load 50 more tasks'}
            </button>
          </div>
        ) : null}
      </section>

      {dialogTask !== null || dialogColumnId ? (
        <TaskDialog
          boardId={board.id}
          columns={board.columns}
          initialColumnId={dialogColumnId}
          onClose={() => {
            setDialogTask(null);
            setDialogColumnId('');
          }}
          onSaved={() => {
            setDialogTask(null);
            setDialogColumnId('');
            finishMutation(dialogTask ? 'Task updated.' : 'Task added.');
          }}
          task={dialogTask}
        />
      ) : null}
    </main>
  );
}
