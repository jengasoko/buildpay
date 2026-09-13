import { useMemo, useState } from 'react';
import { usePayments } from '@/features/payments/hooks/usePayments';
import { useApplications, useUpdateApplication } from '@/features/applications/hooks/useApplications';
import { PaymentFormModal } from '@/features/payments/components/PaymentFormModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import type { Payment } from '@/types/api';

export function PaymentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined);
  const { data, isLoading, error, refetch } = usePayments({ page, page_size: 20 });
  const awaiting = useApplications({ page: 1, page_size: 50, status: 'EMPLOYER_APPROVED' });
  const updateApplication = useUpdateApplication();
  const isFinance = user?.role === 'FINANCIAL_OFFICER' || user?.role === 'ADMIN';

  const perHouseTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const payment of data?.items ?? []) {
      const key = payment.application_house_title || 'Unattributed';
      totals.set(key, (totals.get(key) ?? 0) + Number(payment.amount));
    }
    totals.set('All time', data?.items?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0);
    return Array.from(totals.entries());
  }, [data]);

  if (isLoading) return <LoadingSpinner message="Loading payments..." />;
  if (error) return <ErrorMessage message="Failed to load payments." onRetry={() => refetch()} />;

  const payments = data?.items ?? [];
  const awaitingApproval = awaiting.data?.items ?? [];

  const handleApprove = async (applicationId: number) => {
    try {
      await updateApplication.mutateAsync({
        id: applicationId,
        data: { status: 'FINANCIAL_APPROVED' },
      });
      toast.success('Application financially approved — occupancy created');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <span className="text-sm text-gray-500">{data?.total ?? 0} total</span>
        </div>
        <button
          onClick={() => {
            setEditingPayment(undefined);
            setModalOpen(true);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Record Payment
        </button>
      </div>

      {isFinance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <section className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Funding pipeline</h2>
            {awaitingApproval.length === 0 ? (
              <p className="text-sm text-gray-500">No applications awaiting financial review.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {awaitingApproval.map((application) => (
                  <li key={application.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {application.house_title || `House #${application.house_id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {application.employee_username} · employer-approved{' '}
                        {application.employer_username ? `by ${application.employer_username}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApprove(application.id)}
                      disabled={updateApplication.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve & fund
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Collected by unit (page)</h2>
            {perHouseTotals.length === 0 ? (
              <p className="text-sm text-gray-500">No payments on this page.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {perHouseTotals.map(([key, total]) => (
                  <li key={key} className="py-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{key}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {payments.length === 0 ? (
        <EmptyState message="No payments found." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{payment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.application_id ? (
                      <>
                        #{payment.application_id}
                        {payment.application_house_title && (
                          <span className="block text-xs text-gray-400">
                            {payment.application_house_title} · {payment.application_employee_username}
                          </span>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.reference || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingPayment(payment);
                        setModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.total > 20 && (
            <div className="flex justify-between items-center px-6 py-3 border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(data.total / 20)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= data.total}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <PaymentFormModal payment={editingPayment} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
