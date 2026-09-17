import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useOccupancyTrend } from '@/features/dashboard/hooks/useDashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MONTHS } from './RevenueTrendChart';

function monthLabel(month: string) {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function OccupancyTrendChart() {
  const { data, isLoading, error } = useOccupancyTrend(MONTHS);

  if (isLoading) return <LoadingSpinner message="Loading occupancy trend..." />;
  if (error) return <p className="text-sm text-red-600">Failed to load occupancy trend.</p>;

  const points = data?.data ?? [];
  const hasData = points.some((p) => p.total > 0);
  if (!hasData) {
    return <p className="py-8 text-sm text-gray-500 text-center">No occupancy data yet.</p>;
  }

  const enriched = points.map((p) => ({
    ...p,
    label: monthLabel(p.month),
    available: Math.max(p.total - p.occupied, 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={enriched} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={36}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="occupied" name="Occupied" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        <Bar dataKey="available" name="Available" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}