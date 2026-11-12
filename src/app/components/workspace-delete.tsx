import { deleteWorkspaceAction } from '@/app/actions/workspaces';
import { ConfirmDelete } from './confirm-delete';

export function WorkspaceDelete({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDelete
      id={id}
      name={name}
      action={deleteWorkspaceAction}
      fieldName="workspaceId"
      description="Only empty workspaces can be deleted. Records in this workspace are never removed by this action."
    />
  );
}
