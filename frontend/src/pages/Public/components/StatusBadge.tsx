import type { ProjectStatus } from '@/types/api';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  PLANNED: {
    label: 'Planned',
    className: 'border-sky-400/30 bg-sky-500/15 text-sky-300',
  },
  ONGOING: {
    label: 'Ongoing',
    className: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
  },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PLANNED;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}