import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCollectionRate } from '@/features/dashboard/hooks/useDashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MONTHS } from './RevenueTrendChart';

function monthLabel(month: string) {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function CollectionRateChart() {
  const { data, isLoading, error } = useCollectionRate(MONTHS);

  if (isLoading) return <LoadingSpinner message="Loading collection rate..." />;
  if (error) return <p className="text-sm text-red-600">Failed to load collection rate.</p>;

  const points = data?.data ?? [];
  const hasData = points.some((p) => p.invoiced > 0);
  if (!hasData) {
    return <p className="py-8 text-sm text-gray-500 text-center">No billing data yet.</p>;
  }

  const enriched = points.map((p) => ({ ...p, label: monthLabel(p.month) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={enriched} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="amount"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${Math.round(v)}`}
          width={64}
        />
        <YAxis
          yAxisId="rate"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
          width={44}
        />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'rate') return [`${value}%`, 'Collection Rate'];
            return [formatCurrency(Number(value)), name === 'invoiced' ? 'Invoiced' : 'Collected'];
          }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Line
          yAxisId="amount"
          type="monotone"
          dataKey="invoiced"
          name="Invoiced"
          stroke="#9ca3af"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="amount"
          type="monotone"
          dataKey="collected"
          name="Collected"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="rate"
          name="rate"
          stroke="#4f46e5"
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}