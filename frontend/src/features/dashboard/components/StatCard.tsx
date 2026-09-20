import type { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: ReactNode;
  iconBg?: string;
  valueAccent?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  iconBg = 'bg-indigo-50 text-indigo-600',
  valueAccent = 'text-gray-900',
}: StatCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {icon && (
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`mt-1 truncate text-2xl font-bold tracking-tight ${valueAccent}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}