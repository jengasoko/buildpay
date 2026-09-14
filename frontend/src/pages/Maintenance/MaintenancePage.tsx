import { useState } from 'react';
import { useMaintenanceRequests, useCreateMaintenance, useUpdateMaintenance } from '@/features/maintenance/hooks/useMaintenance';
import { useHouses } from '@/features/houses/hooks/useHouses';
import { useUsers } from '@/features/users/hooks/useUsers';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/services/api';
import type { MaintenanceRequest, MaintenanceStatus, MaintenanceCategory } from '@/types/api';

const PAGE_SIZE = 20;

const STATUS_TABS: Array<{ label: string; value: MaintenanceStatus | null }> = [
  { label: 'All', value: null },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  SUBMITTED: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  SUBMITTED: 'Submitted',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  normal: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-800',
};

const MANAGER_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER'];

export function MaintenancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<MaintenanceRequest | null>(null);
  const [resolveTarget, setResolveTarget] = useState<MaintenanceRequest | null>(null);
  const [closeTarget, setCloseTarget] = useState<MaintenanceRequest | null>(null);

  const { data, isLoading, error, refetch } = useMaintenanceRequests({
    page,
    page_size: PAGE_SIZE,
    status: status ?? undefined,
  });
  const { data: usersData } = useUsers(1, 500);
  const createMutation = useCreateMaintenance(() => setCreateOpen(false));
  const updateMutation = useUpdateMaintenance();

  const role = user?.role ?? 'EMPLOYEE';
  const isManager = MANAGER_ROLES.includes(role);

  const employees = (usersData?.items ?? []).filter((u) => u.role === 'EMPLOYEE');

  if (isLoading) return <LoadingSpinner message="Loading maintenance requests..." />;
  if (error) return <ErrorMessage message="Failed to load maintenance requests." onRetry={() => refetch()} />;

  const requests = data?.items ?? [];

  const handleAssign = async (requestId: number, employeeId: number) => {
    try {
      await updateMutation.mutateAsync({ id: requestId, data: { status: 'ASSIGNED', assigned_to_id: employeeId } });
      toast.success('Request assigned');
      setAssignTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleResolve = async (requestId: number, resolutionNote: string) => {
    try {
      await updateMutation.mutateAsync({ id: requestId, data: { status: 'RESOLVED', resolution_note: resolutionNote || undefined } });
      toast.success('Request resolved');
      setResolveTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleClose = async (requestId: number) => {
    try {
      await updateMutation.mutateAsync({ id: requestId, data: { status: 'CLOSED' } });
      toast.success('Request closed');
      setCloseTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} total</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Report Issue
        </button>
      </div>

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

      {requests.length === 0 ? (
        <EmptyState message="No maintenance requests found." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  House
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => {
                const canAssign = isManager && req.status === 'SUBMITTED';
                const canResolve = isManager && (req.status === 'ASSIGNED' || req.status === 'SUBMITTED' || req.status === 'IN_PROGRESS');
                const canClose = !isManager && req.status === 'RESOLVED' && req.reported_by_id === user?.id;
                const hasAction = canAssign || canResolve || canClose;

                return (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{req.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.house_title || `House #${req.house_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.employee_username || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.category?.replace('_', ' ') || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${PRIORITY_STYLES[req.priority] ?? PRIORITY_STYLES.normal}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${STATUS_STYLES[req.status]}`}>
                        {STATUS_LABELS[req.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!hasAction ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          {req.assigned_to_username && (req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS') && (
                            <span className="text-xs text-gray-500">→ {req.assigned_to_username}</span>
                          )}
                          {canAssign && (
                            <button
                              onClick={() => setAssignTarget(req)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Assign
                            </button>
                          )}
                          {canResolve && (
                            <button
                              onClick={() => setResolveTarget(req)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Resolve
                            </button>
                          )}
                          {canClose && (
                            <button
                              onClick={() => setCloseTarget(req)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      )}
                    </td>
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

      {createOpen && (
        <CreateMaintenanceModal
          isPending={createMutation.isPending}
          onSubmit={(data) => createMutation.mutateAsync(data)}
          onClose={() => setCreateOpen(false)}
          onError={(msg) => toast.error(msg)}
        />
      )}

      {assignTarget && (
        <AssignModal
          employees={employees}
          isPending={updateMutation.isPending}
          onSubmit={(employeeId) => handleAssign(assignTarget.id, employeeId)}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {resolveTarget && (
        <ResolveModal
          isPending={updateMutation.isPending}
          onSubmit={(note) => handleResolve(resolveTarget.id, note)}
          onClose={() => setResolveTarget(null)}
        />
      )}

      {closeTarget && (
        <ConfirmModal
          message={`Close request #${closeTarget.id}?`}
          confirmLabel="Close"
          isPending={updateMutation.isPending}
          onSubmit={() => handleClose(closeTarget.id)}
          onClose={() => setCloseTarget(null)}
        />
      )}
    </div>
  );
}

function CreateMaintenanceModal({
  isPending,
  onSubmit,
  onClose,
  onError,
}: {
  isPending: boolean;
  onSubmit: (data: { house_id: number; category: MaintenanceCategory; title: string; description: string; priority: 'low' | 'normal' | 'high' }) => Promise<unknown>;
  onClose: () => void;
  onError: (msg: string) => void;
}) {
  const { data: housesData } = useHouses({ page: 1, page_size: 500 });
  const houses = housesData?.items ?? [];

  const [houseId, setHouseId] = useState(houses[0]?.id ?? 0);
  const [category, setCategory] = useState<MaintenanceCategory>('OTHER');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit({ house_id: houseId, category, title, description, priority });
    } catch (err) {
      onError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Maintenance Issue</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">House</label>
            <select
              value={houseId}
              onChange={(e) => setHouseId(Number(e.target.value))}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {houses.map((h) => (
                <option key={h.id} value={h.id}>{h.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="STRUCTURAL">Structural</option>
              <option value="PEST_CONTROL">Pest Control</option>
              <option value="APPLIANCE">Appliance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !houseId}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({
  employees,
  isPending,
  onSubmit,
  onClose,
}: {
  employees: Array<{ id: number; username: string }>;
  isPending: boolean;
  onSubmit: (employeeId: number) => void;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState(employees[0]?.id ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Technician</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Employee</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {employees.map((u) => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => selectedId && onSubmit(selectedId)}
            disabled={isPending || !selectedId}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResolveModal({
  isPending,
  onSubmit,
  onClose,
}: {
  isPending: boolean;
  onSubmit: (resolutionNote: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolve Request</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Resolution Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(note)}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Resolving...' : 'Resolve'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  message,
  confirmLabel,
  isPending,
  onSubmit,
  onClose,
}: {
  message: string;
  confirmLabel: string;
  isPending: boolean;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <p className="text-sm text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
