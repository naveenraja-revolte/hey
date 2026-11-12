# Fieldnotes

Fieldnotes is a private visual task board for organizing personal projects. Move work through your own columns, keep priorities and due dates visible, and return to saved boards whenever you sign in.

## Feature guide

### Your account

Create an account with your name, email address, and password. Sign in to return to your saved boards, and sign out when you are done. Boards are private to the account that created them. Email verification, password-reset emails, and shared team access are not included yet.

### Boards and columns

Create a board for a project from **Your boards**. New boards start with **To Do**, **In Progress**, and **Done** columns. Rename or delete a board from its board page. Add columns to match your own workflow, rename them, or move them left and right. A column can be removed only when it has no tasks, and every board must keep at least one column.

### Tasks

Add tasks from the board or a specific column. Every task needs a title; description and due date are optional. Choose **Low**, **Normal**, or **High** priority. Tasks are assigned to you because boards are personal. Edit or delete a task when its details change. Move it by dragging the card or using its **Move** selector with a keyboard or touch device. Larger boards load tasks in pages; choose **Load 50 more tasks** to reveal the next group.

### Saving and privacy

Accounts, boards, columns, and tasks are saved in the app's database, not just in the browser tab. Signing out does not remove your work.

## Run locally

1. Install the dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `BETTER_AUTH_SECRET` to a unique value with at least 32 characters. One way to generate it is `openssl rand -base64 32`.
3. Apply the included database migrations with `npm run db:migrate`.
4. Start the app with `npm run dev` and open `http://localhost:3000`.

The default database is a local SQLite file at `dev.db`. Set `DATABASE_URL` to change its location. Do not commit `.env.local` or the database file. Apply the committed migrations before starting the app in a new environment.

## Checks

- `npm run format -- <files>` formats the files you specify.
- `npm run lint` checks the source.
- `npm run type-check` checks TypeScript.
- `npm test` runs the service and validation tests.
- `npm run build` creates a production build.
