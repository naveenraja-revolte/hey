import Link from 'next/link';

type ToolbarOption = { value: string; label: string };
type DataToolbarProps = {
  query?: string;
  status?: string;
  relation?: string;
  sort?: string;
  statusOptions?: ToolbarOption[];
  relationOptions?: ToolbarOption[];
  sortOptions?: ToolbarOption[];
  clientId?: string;
  clientOptions?: Array<{ id: string; name: string }>;
  showOverdue?: boolean;
  overdue?: boolean;
};

const control = 'min-h-11 rounded-control border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring';

export function DataToolbar({
  query = '', status = '', relation = '', sort = '', statusOptions, relationOptions, sortOptions,
  clientId = '', clientOptions, showOverdue = false, overdue,
}: DataToolbarProps) {
  return (
    <form method="get" role="search" className="flex flex-wrap items-end gap-3 rounded-container border border-border bg-card p-4">
      <label className="grid min-w-48 flex-1 gap-1.5 text-sm font-medium">
        Search
        <input name="q" type="search" defaultValue={query} placeholder="Search records" className={control} />
      </label>
      {statusOptions && (
        <label className="grid min-w-40 gap-1.5 text-sm font-medium">
          Status
          <select name="status" defaultValue={status} className={control}>
            <option value="">All statuses</option>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      )}
      {relationOptions && (
        <label className="grid min-w-40 gap-1.5 text-sm font-medium">
          Projects
          <select name="relation" defaultValue={relation} className={control}>
            {relationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      )}
      {sortOptions && (
        <label className="grid min-w-40 gap-1.5 text-sm font-medium">
          Sort by
          <select name="sort" defaultValue={sort} className={control}>
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      )}
      {clientOptions && (
        <label className="grid min-w-40 gap-1.5 text-sm font-medium">
          Client
          <select name="clientId" defaultValue={clientId} className={control}>
            <option value="">All clients</option>
            {clientOptions.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
      )}
      {showOverdue && (
        <label className="flex min-h-11 items-center gap-2 rounded-control px-2 text-sm font-medium">
          <input type="checkbox" name="overdue" value="true" defaultChecked={overdue} className="size-4 accent-primary" />
          Overdue only
        </label>
      )}
      <input type="hidden" name="page" value="1" />
      <button className="min-h-11 rounded-control bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ring">Apply</button>
      <Link href="?" className="min-h-11 content-center px-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">Clear</Link>
    </form>
  );
}
