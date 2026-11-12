'use client';

import { FormEvent, useState, useTransition } from 'react';
import { createTaskAction, updateTaskAction } from '@/actions/task-actions';
import type { BoardPageData } from '@/services/board-service';
import type { Task } from '@/db/schema';

interface TaskDialogProps {
  boardId: string;
  columns: BoardPageData['columns'];
  initialColumnId: string;
  task: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskDialog({
  boardId,
  columns,
  initialColumnId,
  task,
  onClose,
  onSaved,
}: TaskDialogProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const isEditing = Boolean(task);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const values = {
      boardId,
      columnId: String(formData.get('columnId') ?? ''),
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      priority: String(formData.get('priority') ?? 'normal') as 'low' | 'normal' | 'high',
      dueDate: String(formData.get('dueDate') ?? ''),
    };

    startTransition(async () => {
      const result =
        isEditing && task
          ? await updateTaskAction({ ...values, taskId: task.id })
          : await createTaskAction(values);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="task-dialog-title"
        aria-modal="true"
        className="dialog-panel task-dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !pending) onClose();
        }}
        role="dialog"
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">TASK DETAILS</p>
            <h2 id="task-dialog-title">{isEditing ? 'Edit task' : 'Add a task'}</h2>
          </div>
          <button
            aria-label="Close task form"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <form className="stacked-form" onSubmit={handleSubmit}>
          <label className="field-label">
            Task title
            <input
              autoFocus
              className="text-input"
              defaultValue={task?.title ?? ''}
              maxLength={120}
              name="title"
              placeholder="What needs to move forward?"
              required
            />
          </label>
          <label className="field-label">
            Description <span className="field-optional">OPTIONAL</span>
            <textarea
              className="text-input text-area"
              defaultValue={task?.description ?? ''}
              maxLength={2000}
              name="description"
              placeholder="Add a little context"
              rows={4}
            />
          </label>
          <div className="form-pair">
            <label className="field-label">
              Priority
              <select
                className="text-input"
                defaultValue={task?.priority ?? 'normal'}
                name="priority"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="field-label">
              Due date <span className="field-optional">OPTIONAL</span>
              <input
                className="text-input"
                defaultValue={task?.dueDate ?? ''}
                name="dueDate"
                type="date"
              />
            </label>
          </div>
          <label className="field-label">
            Column
            <select
              className="text-input"
              defaultValue={task?.columnId ?? initialColumnId}
              name="columnId"
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </select>
          </label>
          <p className="assignee-note">Assigned to you</p>
          {error ? (
            <p className="form-message form-message-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="dialog-actions">
            <button
              className="button button-quiet"
              disabled={pending}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button className="button button-primary" disabled={pending} type="submit">
              {pending ? 'Saving…' : isEditing ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
