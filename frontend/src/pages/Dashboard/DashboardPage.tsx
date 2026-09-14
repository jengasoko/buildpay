import { useDashboardStats, useEmployeeDashboard } from '@/features/dashboard/hooks/useDashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import type { ApplicationStatus, UserRole, InvoiceStatus, LeaseStatus } from '@/types/api';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  EMPLOYER_APPROVED: 'bg-blue-100 text-blue-800',
  FINANCIAL_APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  EMPLOYER_APPROVED: 'Employer Approved',
  FINANCIAL_APPROVED: 'Financial Approved',
  REJECTED: 'Rejected',
};

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  VOID: 'bg-gray-100 text-gray-800',
};

const LEASE_STATUS_STYLES: Record<LeaseStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_SIGNATURE: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  TERMINATED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  accent?: string;
}

function StatCard({ label, value, hint, accent = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function EmployeeDashboardView() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useEmployeeDashboard();

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message="Failed to load dashboard data." onRetry={() => refetch()} />;

  const balance = data?.account_balance ?? 0;
  const balanceAccent = balance > 0 ? 'text-red-600' : 'text-green-600';
  const leaseStatus = data?.lease?.status ?? null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, <span className="font-medium">{user?.username}</span>
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/houses"
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
          >
            Browse Houses
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Account Balance"
          value={`$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          accent={balanceAccent}
        />
        <StatCard
          label="My Lease"
          value={leaseStatus === 'ACTIVE' ? 'Active' : leaseStatus ?? 'None'}
          accent={leaseStatus === 'ACTIVE' ? 'text-green-600' : 'text-gray-900'}
        />
        <StatCard
          label="Open Maintenance Requests"
          value={data?.open_maintenance ?? 0}
          accent={(data?.open_maintenance ?? 0) > 0 ? 'text-yellow-600' : 'text-green-600'}
        />
        <StatCard
          label="Applications Submitted"
          value={data?.counts.applications ?? 0}
        />
      </div>

      {data?.lease ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">My Lease</h2>
            <Link to="/my-housing" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
              View statement
            </Link>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
                <span className={`mt-1 inline-block px-2 py-1 text-xs rounded-full ${LEASE_STATUS_STYLES[data.lease.status]}`}>
                  {data.lease.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rent Amount</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  ${data.lease.rent_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Deposit Amount</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  ${data.lease.deposit_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {new Date(data.lease.start_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Lease</h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500 mb-4">You don't have an active lease yet.</p>
            <Link
              to="/houses"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Browse Houses
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
        </div>
        {(!data?.recent_invoices || data.recent_invoices.length === 0) ? (
          <p className="px-6 py-8 text-sm text-gray-500">No invoices yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recent_invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.period_start).toLocaleDateString()} &ndash;{' '}
                    {new Date(invoice.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${invoice.paid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${invoice.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${INVOICE_STATUS_STYLES[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AdminDashboardView() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message="Failed to load dashboard data." onRetry={() => refetch()} />;

  const counts = data?.counts;
  const role: UserRole = user?.role ?? 'EMPLOYEE';
  const isFinancial = role === 'FINANCIAL_OFFICER' || role === 'ADMIN';
  const recent = data?.recent_applications ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, <span className="font-medium">{user?.username}</span>
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/houses"
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
          >
            Browse Houses
          </Link>
          {isFinancial && (
            <Link
              to="/payments"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Record Payment
            </Link>
          )}
        </div>
      </div>

      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Projects" value={counts.projects} />
          <StatCard label="Total Houses" value={counts.houses} />
          <StatCard label="Available Houses" value={counts.available_houses} accent="text-green-600" />
          <StatCard label="Occupied Houses" value={counts.occupied_houses} accent="text-red-600" />
          <StatCard label="Applications" value={counts.applications} />
          <StatCard label="Pending Review" value={counts.pending_applications} accent="text-yellow-600" />
          <StatCard label="Users" value={counts.users} />
          <StatCard
            label="Payments Collected"
            value={
              counts.payments > 0
                ? `$${data?.total_payment_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : '$0.00'
            }
            accent="text-green-700"
            hint={`${counts.payments} payments recorded`}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          <Link to="/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">No applications yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  House
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recent.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {application.house_title || `House #${application.house_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.employee_username || `User #${application.employee_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_STYLES[application.status]}`}>
                      {STATUS_LABELS[application.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const role: UserRole = user?.role ?? 'EMPLOYEE';

  if (role === 'EMPLOYEE') {
    return <EmployeeDashboardView />;
  }

  return <AdminDashboardView />;
}
