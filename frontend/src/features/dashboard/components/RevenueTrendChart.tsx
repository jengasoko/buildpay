import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRevenueTrend } from '@/features/dashboard/hooks/useDashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const MONTHS = 12;

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function monthLabel(month: string) {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function RevenueTrendChart() {
  const { data, isLoading, error } = useRevenueTrend(MONTHS);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (isLoading) return <LoadingSpinner message="Loading revenue trend..." />;
  if (error) return <p className="text-sm text-red-600">Failed to load revenue trend.</p>;

  const points = data?.data ?? [];
  const hasData = points.some((p) => p.value > 0);
  if (!hasData) {
    return <p className="py-8 text-sm text-gray-500 text-center">No payment data yet.</p>;
  }

  const enriched = points.map((p, i) => ({ ...p, label: monthLabel(p.month), index: i }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={enriched}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          onMouseMove={(state) => {
            const idx = state?.activeTooltipIndex;
            setActiveIndex(typeof idx === 'number' ? idx : null);
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${Math.round(v)}`}
            width={64}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), 'Collected']}
            labelFormatter={(_, payload) => (payload?.[0]?.payload as { label?: string })?.label ?? ''}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4f46e5"
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: activeIndex !== null ? 5 : 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}