import { useApplications } from '@/features/applications/hooks/useApplications';
import { useMyPayments } from '@/features/payments/hooks/usePayments';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useMyLease, useLeaseStatement } from '@/features/leases/hooks/useLeases';
import { useInvoices } from '@/features/invoices/hooks/useInvoices';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import type { Application, ApplicationStatus, InvoiceStatus, Lease, Invoice } from '@/types/api';

const TIMELINE_STEPS: ApplicationStatus[] = ['PENDING', 'EMPLOYER_APPROVED', 'FINANCIAL_APPROVED'];

const STEP_INDEX: Record<ApplicationStatus, number> = {
  PENDING: 0,
  EMPLOYER_APPROVED: 1,
  FINANCIAL_APPROVED: 2,
  REJECTED: 1,
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  EMPLOYER_APPROVED: 'Employer Approved',
  FINANCIAL_APPROVED: 'Financial Approved / Move-in',
  REJECTED: 'Rejected',
};

const LEASE_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  TERMINATED: 'bg-gray-100 text-gray-800',
  DRAFT: 'bg-blue-100 text-blue-800',
  PENDING_SIGNATURE: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-blue-100 text-blue-800',
};

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  VOID: 'bg-gray-100 text-gray-800',
};

function StatusBadge({ status, styles }: { status: string; styles: Record<string, string> }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

function LeaseCard({ lease }: { lease: Lease }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">My Lease</h3>
        <StatusBadge status={lease.status} styles={LEASE_STATUS_STYLES} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-gray-500">House</dt>
          <dd className="font-medium text-gray-900">{lease.house_title}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Room</dt>
          <dd className="font-medium text-gray-900">{lease.room_number || 'Room not assigned'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Rent</dt>
          <dd className="font-medium text-gray-900">${lease.rent_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Deposit</dt>
          <dd className="font-medium text-gray-900">${lease.deposit_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Deposit Paid</dt>
          <dd className="font-medium text-gray-900">{lease.deposit_paid ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Billing Day</dt>
          <dd className="font-medium text-gray-900">{lease.billing_day}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Start Date</dt>
          <dd className="font-medium text-gray-900">{new Date(lease.start_date).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt className="text-gray-500">End Date</dt>
          <dd className="font-medium text-gray-900">{lease.end_date ? new Date(lease.end_date).toLocaleDateString() : 'Open-ended'}</dd>
        </div>
      </dl>
    </div>
  );
}

function AccountCard({ invoices }: { invoices: Invoice[] }) {
  const openInvoices = invoices.filter((inv) => inv.status === 'OPEN' || inv.status === 'PARTIAL');
  const totalOutstanding = openInvoices.reduce((sum, inv) => sum + inv.balance_due, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
      <div className="mb-6">
        <p className="text-sm text-gray-500">Total Outstanding</p>
        <p className="text-3xl font-bold text-indigo-600">${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      </div>
      {openInvoices.length === 0 ? (
        <EmptyState message="You have no outstanding invoices." />
      ) : (
        <ul className="divide-y divide-gray-200">
          {openInvoices.map((inv) => (
            <li key={inv.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(inv.period_start).toLocaleDateString()} – {new Date(inv.period_end).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">Due {new Date(inv.due_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={inv.status} styles={INVOICE_STATUS_STYLES} />
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    ${inv.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                    <span className="text-xs text-gray-400 font-normal">/ ${inv.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatementCard({ leaseId }: { leaseId: number }) {
  const statement = useLeaseStatement(leaseId);

  if (statement.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <LoadingSpinner message="Loading statement..." />
      </div>
    );
  }

  const data = statement.data;
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Statement of Account</h3>
        <span className="text-sm font-semibold text-gray-900">
          Balance: ${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
      {data.entries.length === 0 ? (
        <EmptyState message="No statement entries yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-500">Date</th>
                <th className="text-left py-2 font-medium text-gray-500">Description</th>
                <th className="text-right py-2 font-medium text-gray-500">Amount</th>
                <th className="text-right py-2 font-medium text-gray-500">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 text-gray-900">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="py-2 text-gray-900">{entry.description}</td>
                  <td className={`py-2 text-right font-medium ${entry.type === 'PAYMENT' ? 'text-green-600' : 'text-gray-600'}`}>
                    {entry.type === 'PAYMENT' ? '−' : '+'}${Math.abs(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 text-right text-gray-900">
                    ${entry.running_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function JourneyTimeline({ application }: { application: Application }) {
  const currentIndex = STEP_INDEX[application.status];
  const rejected = application.status === 'REJECTED';
  return (
    <div>
      <div className="mb-4">
        <span className="text-lg font-semibold text-gray-900">
          {application.house_title || `House #${application.house_id}`}
        </span>
        <span className="ml-2 text-sm text-gray-500">
          submitted {new Date(application.created_at).toLocaleDateString()}
        </span>
      </div>
      <ol className="flex items-center">
        {TIMELINE_STEPS.map((step, index) => {
          const done = !rejected && index <= currentIndex;
          const active = !rejected && index === currentIndex;
          return (
            <li key={step} className={`flex items-center flex-1 ${index === 0 ? '' : ''}`}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    done
                      ? active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {done && !active ? '✓' : index + 1}
                </div>
                <span className="mt-2 text-xs text-gray-600 text-center">{STATUS_LABELS[step]}</span>
              </div>
              {index < TIMELINE_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 ${index < currentIndex && !rejected ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
      {rejected && (
        <p className="mt-4 text-sm text-red-600">This application was rejected.</p>
      )}
    </div>
  );
}

export function MyHousingPage() {
  const { user } = useAuth();
  const applications = useApplications({ page: 1, page_size: 50 });
  const payments = useMyPayments({ page: 1, page_size: 20 });
  const notifications = useNotifications(10);
  const leaseQuery = useMyLease();
  const invoices = useInvoices({ page: 1, page_size: 20 });

  const isLoading = applications.isLoading || payments.isLoading || invoices.isLoading;
  if (isLoading) {
    return <LoadingSpinner message="Loading your housing details..." />;
  }

  const myApplications = applications.data?.items ?? [];
  const myPayments = payments.data?.items ?? [];
  const myNotifications = notifications.data?.items ?? [];
  const myInvoices = invoices.data?.items ?? [];
  const lease = leaseQuery.data;

  const activeApplication = myApplications.find((a) => a.status === 'FINANCIAL_APPROVED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Housing</h1>
        <p className="text-sm text-gray-500">
          {user?.username} · track your housing application journey
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Tenancy &amp; Account</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leaseQuery.isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <LoadingSpinner message="Loading lease..." />
            </div>
          ) : lease ? (
            <LeaseCard lease={lease} />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Lease</h3>
              <p className="text-sm text-gray-500">No active lease found.</p>
            </div>
          )}
          <AccountCard invoices={myInvoices} />
        </div>
        {lease && <div className="mt-6"><StatementCard leaseId={lease.id} /></div>}
      </section>

      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Journey</h2>
        {activeApplication ? (
          <div className="rounded-md bg-green-50 p-4 mb-4">
            <p className="text-sm text-green-800">
              Housing confirmed for <strong>{activeApplication.house_title}</strong>.
              {activeApplication.employer_username && (
                <> Approved by <strong>{activeApplication.employer_username}</strong>.</>
              )}
            </p>
          </div>
        ) : null}
        {myApplications.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven't applied for any houses yet.{' '}
            <Link to="/houses" className="text-indigo-600 hover:underline">
              Browse available houses
            </Link>
          </p>
        ) : (
          <div className="space-y-6">
            {myApplications.map((application) => (
              <JourneyTimeline key={application.id} application={application} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Payments</h2>
          {myPayments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments recorded for you yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {myPayments.map((payment) => (
                <li key={payment.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.application_house_title || `Application #${payment.application_id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.reference || `Ref #${payment.id}`} ·{' '}
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <span className="text-xs text-gray-500">{notifications.data?.total ?? 0} total</span>
          </div>
          {myNotifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {myNotifications.map((notification) => (
                <li key={notification.id} className="py-3">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-xs text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
