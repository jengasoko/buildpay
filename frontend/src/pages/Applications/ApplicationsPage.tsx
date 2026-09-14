import { useState } from 'react';
import { useApplications, useUpdateApplication } from '@/features/applications/hooks/useApplications';
import { ApplyModal } from '@/features/applications/components/ApplyModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import type { Application, ApplicationStatus, UserRole } from '@/types/api';
import { getApiErrorMessage } from '@/services/api';

const PAGE_SIZE = 20;

const STATUS_TABS: Array<{ label: string; value: ApplicationStatus | null }> = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Employer Approved', value: 'EMPLOYER_APPROVED' },
  { label: 'Financial Approved', value: 'FINANCIAL_APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

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

const ROLE_APPROVAL: Record<string, ApplicationStatus[]> = {
  EMPLOYER: ['PENDING'],
  FINANCIAL_OFFICER: ['EMPLOYER_APPROVED'],
  ADMIN: ['PENDING', 'EMPLOYER_APPROVED'],
};

function canReview(role: UserRole, status: ApplicationStatus): boolean {
  const from: ApplicationStatus[] | undefined = ROLE_APPROVAL[role];
  return from ? from.includes(status) : false;
}

const approveTarget: Record<ApplicationStatus, ApplicationStatus> = {
  PENDING: 'EMPLOYER_APPROVED',
  EMPLOYER_APPROVED: 'FINANCIAL_APPROVED',
  FINANCIAL_APPROVED: 'FINANCIAL_APPROVED',
  REJECTED: 'REJECTED',
};

export function ApplicationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const { data, isLoading, error, refetch } = useApplications({
    page,
    page_size: PAGE_SIZE,
    status: status ?? undefined,
  });
  const updateMutation = useUpdateApplication();

  const role = user?.role ?? 'EMPLOYEE';
  const isEmployee = role === 'EMPLOYEE';

  if (isLoading) return <LoadingSpinner message="Loading applications..." />;
  if (error) return <ErrorMessage message="Failed to load applications." onRetry={() => refetch()} />;

  const applications = data?.items ?? [];

  const handleTransition = async (application: Application, next: ApplicationStatus) => {
    setActionError('');
    try {
      await updateMutation.mutateAsync({ id: application.id, data: { status: next } });
      toast.success(`Application marked as ${STATUS_LABELS[next]}`);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setActionError(message);
      toast.error(message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} total</p>
        </div>
        {isEmployee && (
          <button
            onClick={() => setApplyOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Apply for a House
          </button>
        )}
      </div>

      {actionError && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              status === tab.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <EmptyState message="No applications found." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                {!isEmployee && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => {
                const reviewable = canReview(role, application.status);
                return (
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
                    {!isEmployee && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {reviewable ? (
                          <>
                            <button
                              onClick={() =>
                                handleTransition(application, approveTarget[application.status])
                              }
                              disabled={updateMutation.isPending}
                              className="text-green-600 hover:text-green-900 mr-4 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleTransition(application, 'REJECTED')}
                              disabled={updateMutation.isPending}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {data && data.total > PAGE_SIZE && (
            <div className="flex justify-between items-center px-6 py-3 border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(data.total / PAGE_SIZE)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * PAGE_SIZE >= data.total}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {applyOpen && <ApplyModal onClose={() => setApplyOpen(false)} />}
    </div>
  );
}