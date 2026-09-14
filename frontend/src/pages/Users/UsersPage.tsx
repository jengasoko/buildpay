import { useState, type ChangeEvent } from 'react';
import { useUsers, useUpdateUser } from '@/features/users/hooks/useUsers';
import { useCreateEmployment, useDeleteEmployment, useEmployments } from '@/features/employments/hooks/useEmployments';
import { UserFormModal } from '@/features/users/components/UserFormModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/services/api';
import type { User } from '@/types/api';

export function UsersPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [actionError, setActionError] = useState('');
  const { data, isLoading, error, refetch } = useUsers(page, 20);
  const employments = useEmployments(1, 100);
  const updateMutation = useUpdateUser();
  const createEmployment = useCreateEmployment();
  const deleteEmployment = useDeleteEmployment();

  if (isLoading) return <LoadingSpinner message="Loading users..." />;
  if (error) return <ErrorMessage message="Failed to load users." onRetry={() => refetch()} />;

  const users = data?.items ?? [];
  const employers = users.filter((u) => u.role === 'EMPLOYER');

  const handleEmployerChange = async (user: User, employerId: number) => {
    setActionError('');
    try {
      const employment = employments.data?.items.find((e) => e.employee_id === user.id);
      if (employment) {
        await deleteEmployment.mutateAsync(employment.id);
      }
      if (employerId > 0) {
        await createEmployment.mutateAsync({ employer_id: employerId, employee_id: user.id });
      }
      toast.success(employerId > 0 ? 'Employer assignment updated' : 'Employer assignment removed');
    } catch (err) {
      const message = getApiErrorMessage(err);
      setActionError(message);
      toast.error(message);
    }
  };

  const openCreate = () => {
    setEditingUser(undefined);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const toggleActive = async (user: User) => {
    setActionError('');
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        data: { is_active: !user.is_active },
      });
      toast.success(user.is_active ? 'User deactivated' : 'User activated');
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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <span className="text-sm text-gray-500">{data?.total ?? 0} total</span>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Create User
        </button>
      </div>

      {actionError && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role === 'EMPLOYEE' ? (
                      <select
                        value={user.employer_id ?? 0}
                        disabled={createEmployment.isPending || deleteEmployment.isPending}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleEmployerChange(user, Number(e.target.value))
                        }
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white disabled:opacity-50"
                      >
                        <option value={0}>Unassigned</option>
                        {employers.map((employer) => (
                          <option key={employer.id} value={employer.id}>
                            {employer.username}
                          </option>
                        ))}
                      </select>
                    ) : user.employer_username ? (
                      user.employer_username
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(user)}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        user.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                      title={user.is_active ? 'Deactivate account' : 'Activate account'}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                      disabled={user.username === 'admin'}
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

      {modalOpen && <UserFormModal user={editingUser} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
