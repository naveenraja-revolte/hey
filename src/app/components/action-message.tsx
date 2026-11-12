import type { ActionState } from '@/lib/action-state';

export function ActionMessage({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" tabIndex={-1} className="rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>;
  return null;
}

export function FieldMessage({ message }: { message?: string }) {
  return message ? <span role="alert" className="text-xs font-normal text-destructive">{message}</span> : null;
}
