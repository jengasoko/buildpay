import { Link } from 'react-router-dom';
import { ClipboardList, House, KeyRound, Wallet, Wrench } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { useEmployeeDashboard } from '@/features/dashboard/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import {
  DashboardHeader,
  EmptyMessage,
  INVOICE_STATUS_STYLES,
  LEASE_STATUS_STYLES,
  Section,
  StatusBadge,
  formatDate,
  formatMoney,
} from '../dashboardShared';

export function EmployeeView() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useEmployeeDashboard();

  if (isLoading) return <LoadingSpinner message="Loading your dashboard..." />;
  if (error) return <ErrorMessage message="Failed to load your dashboard." onRetry={() => refetch()} />;

  const balance = data?.account_balance ?? 0;
  const balanceAccent = balance > 0 ? 'text-red-600' : 'text-green-600';
  const leaseStatus = data?.lease?.status ?? null;
  const invoices = data?.recent_invoices ?? [];

  return (
    <div>
      <DashboardHeader
        title="My Dashboard"
        subtitle={
          <>
            Welcome back, <span className="font-medium">{user?.username}</span> — here's everything
            about your housing.
          </>
        }
        actions={
          <Link
            to="/houses"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Browse Houses
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Account Balance"
          value={formatMoney(balance)}
          valueAccent={balanceAccent}
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="My Lease"
          value={leaseStatus === 'ACTIVE' ? 'Active' : (leaseStatus ?? 'None')}
          valueAccent={leaseStatus === 'ACTIVE' ? 'text-green-600' : 'text-gray-900'}
          icon={<KeyRound className="h-5 w-5" />}
          iconBg="bg-green-50 text-green-600"
        />
        <StatCard
          label="Open Maintenance Requests"
          value={data?.open_maintenance ?? 0}
          valueAccent={(data?.open_maintenance ?? 0) > 0 ? 'text-yellow-600' : 'text-green-600'}
          icon={<Wrench className="h-5 w-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Applications Submitted"
          value={data?.counts.applications ?? 0}
          icon={<ClipboardList className="h-5 w-5" />}
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      {data?.lease ? (
        <Section
          title="My Lease"
          className="mb-8"
          actions={
            <Link to="/my-housing" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
              View statement
            </Link>
          }
        >
          <div className="p-5">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">House</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{data.lease.house_title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Room</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{data.lease.room_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className="mt-1 inline-block">
                  <StatusBadge status={data.lease.status} styles={LEASE_STATUS_STYLES} />
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rent Amount</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatMoney(data.lease.rent_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Deposit Amount</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatMoney(data.lease.deposit_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(data.lease.start_date)}</p>
              </div>
            </div>
          </div>
        </Section>
      ) : (
        <Section title="My Lease" className="mb-8">
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <House className="mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
            <p className="mb-4 text-sm text-gray-500">You don't have an active lease yet.</p>
            <Link
              to="/houses"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Browse Houses
            </Link>
          </div>
        </Section>
      )}

      <Section title="Recent Invoices">
        {invoices.length === 0 ? (
          <EmptyMessage message="No invoices yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Period
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Paid
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Balance Due
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {formatDate(invoice.period_start)} &ndash; {formatDate(invoice.period_end)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                      {formatMoney(invoice.total_amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {formatMoney(invoice.paid_amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {formatMoney(invoice.balance_due)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge status={invoice.status} styles={INVOICE_STATUS_STYLES} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {formatDate(invoice.due_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}