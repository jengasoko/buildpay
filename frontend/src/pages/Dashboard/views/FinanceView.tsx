import { Link } from 'react-router-dom';
import {
  Banknote,
  FileText,
  KeyRound,
  Percent,
  PiggyBank,
  Receipt,
  TrendingDown,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { RevenueTrendChart } from '@/features/dashboard/components/RevenueTrendChart';
import { CollectionRateChart } from '@/features/dashboard/components/CollectionRateChart';
import { useFinancialDashboard } from '@/features/dashboard/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader, EmptyMessage, Section, ViewAllLink, formatDate, formatMoney } from '../dashboardShared';

const BUCKET_STYLES: Record<string, string> = {
  current: 'text-green-600',
  overdue: 'text-yellow-600',
  late: 'text-red-600',
  escalated: 'text-red-700',
};

function bucketLabel(key: string): string {
  const labels: Record<string, string> = {
    current: 'Current',
    overdue_30: 'Overdue 1–30 days',
    overdue_60: 'Overdue 31–60 days',
    overdue_90: 'Overdue 61–90 days',
    overdue_90_plus: 'Overdue 90+ days',
    late_fee_only: 'Late fee only',
  };
  return labels[key] ?? key.replace(/_/g, ' ');
}

export function FinanceView() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useFinancialDashboard();

  if (isLoading) return <LoadingSpinner message="Loading finance data..." />;
  if (error) return <ErrorMessage message="Failed to load finance data." onRetry={() => refetch()} />;

  const payments = data?.recent_payments ?? [];
  const arrears = data?.arrears ?? [];

  return (
    <div>
      <DashboardHeader
        title="Finance Dashboard"
        subtitle={
          <>
            Welcome back, <span className="font-medium">{user?.username}</span> — cash position,
            collections and arrears at a glance.
          </>
        }
        actions={
          <>
            <Link
              to="/reports"
              className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
            >
              Reports
            </Link>
            <Link
              to="/payments"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Record Payment
            </Link>
          </>
        }
      />

      {data && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Collected This Month"
            value={formatMoney(data.collected_this_month)}
            valueAccent="text-green-700"
            hint={`${data.month}/${data.year}`}
            icon={<PiggyBank className="h-5 w-5" />}
            iconBg="bg-green-50 text-green-600"
          />
          <StatCard
            label="Collected All Time"
            value={formatMoney(data.collected_all_time)}
            hint={`${data.active_leases} active leases`}
            icon={<Banknote className="h-5 w-5" />}
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Outstanding"
            value={formatMoney(data.outstanding)}
            valueAccent="text-amber-600"
            icon={<Receipt className="h-5 w-5" />}
            iconBg="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Overdue"
            value={formatMoney(data.overdue)}
            valueAccent="text-red-600"
            icon={<TrendingDown className="h-5 w-5" />}
            iconBg="bg-red-50 text-red-600"
          />
          <StatCard
            label="Collection Rate"
            value={`${data.collection_rate}%`}
            valueAccent="text-indigo-600"
            hint="Last 12 months"
            icon={<Percent className="h-5 w-5" />}
            iconBg="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            label="Open Invoices"
            value={data.open_invoices}
            icon={<FileText className="h-5 w-5" />}
            iconBg="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Active Leases"
            value={data.active_leases}
            icon={<KeyRound className="h-5 w-5" />}
            iconBg="bg-purple-50 text-purple-600"
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Revenue Trend">
          <div className="p-5">
            <RevenueTrendChart />
          </div>
        </Section>
        <Section title="Payment Collection Rate">
          <div className="p-5">
            <CollectionRateChart />
          </div>
        </Section>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Section title="Arrears Breakdown" className="lg:col-span-1">
          {arrears.length === 0 ? (
            <EmptyMessage message="No arrears." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {arrears.map((bucket) => (
                <li key={bucket.bucket} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-gray-600">{bucketLabel(bucket.bucket)}</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatMoney(bucket.amount)}</p>
                    <p className={`text-xs ${BUCKET_STYLES[bucket.bucket] ?? 'text-gray-500'}`}>
                      {bucket.count} {bucket.count === 1 ? 'lease' : 'leases'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Recent Payments"
          className="lg:col-span-2"
          actions={<ViewAllLink to="/payments" />}
        >
          {payments.length === 0 ? (
            <EmptyMessage message="No payments recorded yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/60">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Reference
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Employee
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      House
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                        {payment.reference ?? `#${payment.id}`}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {payment.application_employee_username || '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {payment.application_house_title || '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                        {formatMoney(payment.amount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {formatDate(payment.payment_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}