interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  accent?: string;
}

export function StatCard({ label, value, hint, accent = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}