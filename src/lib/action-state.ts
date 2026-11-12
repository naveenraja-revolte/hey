export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export const emptyActionState: ActionState = {};

export function fieldErrorsFrom(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1])),
  );
}
