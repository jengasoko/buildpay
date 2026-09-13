import { useState } from 'react';
import { useSystemLogs } from '@/features/system-logs/hooks/useSystemLogs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

const PAGE_SIZE = 20;

const ACTION_STYLES: Record<string, string> = {
  'APPLICATION.CREATED': 'bg-indigo-100 text-indigo-800',
  'APPLICATION.STATUS_CHANGED': 'bg-blue-100 text-blue-800',
  'PAYMENT.CREATED': 'bg-green-100 text-green-800',
  'PAYMENT.UPDATED': 'bg-green-100 text-green-800',
  'USER.REGISTERED': 'bg-purple-100 text-purple-800',
  'USER.UPDATED': 'bg-purple-100 text-purple-800',
  'PROJECT.CREATED': 'bg-teal-100 text-teal-800',
  'PROJECT.UPDATED': 'bg-teal-100 text-teal-800',
  'PROJECT.DELETED': 'bg-teal-100 text-teal-800',
  'HOUSE.CREATED': 'bg-cyan-100 text-cyan-800',
  'HOUSE.UPDATED': 'bg-cyan-100 text-cyan-800',
  'HOUSE.DELETED': 'bg-cyan-100 text-cyan-800',
};

function actionStyle(action: string): string {
  return ACTION_STYLES[action] ?? 'bg-gray-100 text-gray-700';
}

export function SystemLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useSystemLogs({ page, page_size: PAGE_SIZE });

  if (isLoading) return <LoadingSpinner message="Loading system logs..." />;
  if (error) return <ErrorMessage message="Failed to load system logs." onRetry={() => refetch()} />;

  const logs = data?.items ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <p className="text-sm text-gray-500">{data?.total ?? 0} recorded events</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState message="No system log entries yet." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.user_id ? `#${log.user_id}` : 'system'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${actionStyle(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.entity_type ? `${log.entity_type}${log.entity_id ? ` #${log.entity_id}` : ''}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {log.details || '—'}
                  </td>
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