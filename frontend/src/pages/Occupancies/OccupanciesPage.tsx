import { useState } from 'react';
import { useOccupancies, useEndOccupancy } from '@/features/occupancies/hooks/useOccupancies';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import type { Occupancy } from '@/types/api';

const PAGE_SIZE = 20;

export function OccupanciesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [currentOnly, setCurrentOnly] = useState(false);
  const [actionError, setActionError] = useState('');
  const { data, isLoading, error, refetch } = useOccupancies({
    page,
    page_size: PAGE_SIZE,
    current_only: currentOnly || undefined,
  });
  const endMutation = useEndOccupancy();

  const canEnd = user?.role === 'ADMIN' || user?.role === 'FINANCIAL_OFFICER';

  if (isLoading) return <LoadingSpinner message="Loading occupancies..." />;
  if (error) return <ErrorMessage message="Failed to load occupancies." onRetry={() => refetch()} />;

  const occupancies = data?.items ?? [];

  const handleEnd = async (occupancy: Occupancy) => {
    setActionError('');
    try {
      await endMutation.mutateAsync(occupancy.id);
      toast.success(`Move-out recorded for ${occupancy.employee_username}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Occupancies</h1>
          <span className="text-sm text-gray-500">{data?.total ?? 0} total</span>
        </div>
        <button
          onClick={() => {
            setCurrentOnly((v) => !v);
            setPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
            currentOnly
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {currentOnly ? 'Current tenants only' : 'Show all (incl. past)'}
        </button>
      </div>

      {actionError && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {occupancies.length === 0 ? (
        <EmptyState message="No occupancies found." />
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
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ended
                </th>
                {canEnd && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {occupancies.map((occupancy) => (
                <tr key={occupancy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {occupancy.house_title || `House #${occupancy.house_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {occupancy.employee_username || `User #${occupancy.employee_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        occupancy.ended_at
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {occupancy.ended_at ? 'Ended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(occupancy.started_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {occupancy.ended_at ? new Date(occupancy.ended_at).toLocaleDateString() : '—'}
                  </td>
                  {canEnd && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {occupancy.ended_at ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <button
                          onClick={() => handleEnd(occupancy)}
                          disabled={endMutation.isPending}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Move out
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
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
    </div>
  );
}