import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser, useUpdateUser } from '../hooks/useUsers';
import type { User, UserRole } from '@/types/api';
import { getApiErrorMessage } from '@/services/api';

interface UserFormModalProps {
  user?: User;
  onClose: () => void;
}

export const USER_ROLES: UserRole[] = [
  'ADMIN',
  'PROJECT_MANAGER',
  'FINANCIAL_OFFICER',
  'EMPLOYER',
  'EMPLOYEE',
];

const commonFields = {
  first_name: z.string().max(100).optional().or(z.literal('')),
  last_name: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
};

const createSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(USER_ROLES).optional(),
  ...commonFields,
});

const editSchema = z.object({
  role: z.enum(USER_ROLES),
  is_active: z.boolean(),
  ...commonFields,
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

const inputClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';

export function UserFormModal({ user, onClose }: UserFormModalProps) {
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const isCreate = !user;

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: '', email: '', password: '', first_name: '', last_name: '', phone: '', role: 'EMPLOYEE' },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: user
      ? {
          first_name: user.first_name ?? '',
          last_name: user.last_name ?? '',
          phone: user.phone ?? '',
          role: user.role,
          is_active: user.is_active,
        }
      : undefined,
  });

  const isBusy = createMutation.isPending || updateMutation.isPending;
  const errorMessage = createMutation.error || updateMutation.error
    ? getApiErrorMessage(createMutation.error ?? updateMutation.error)
    : '';

  const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

  const onCreateSubmit = async (data: CreateFormData) => {
    await createMutation.mutateAsync({
      username: data.username,
      email: data.email,
      password: data.password,
      role: data.role,
      first_name: clean(data.first_name),
      last_name: clean(data.last_name),
      phone: clean(data.phone),
    });
    onClose();
  };

  const onEditSubmit = async (data: EditFormData) => {
    if (!user) return;
    await updateMutation.mutateAsync({
      id: user.id,
      data: {
        first_name: clean(data.first_name),
        last_name: clean(data.last_name),
        phone: clean(data.phone),
        role: data.role,
        is_active: data.is_active,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isCreate ? 'Create User' : `Edit ${user.username}`}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
              ×
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {isCreate ? (
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input id="username" {...createForm.register('username')} className={inputClass} />
                {createForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.username.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input id="email" type="email" {...createForm.register('email')} className={inputClass} />
                {createForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input id="password" type="password" {...createForm.register('password')} className={inputClass} />
                {createForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input id="first_name" {...createForm.register('first_name')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input id="last_name" {...createForm.register('last_name')} className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input id="phone" {...createForm.register('phone')} className={inputClass} />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                <select id="role" {...createForm.register('role')} className={inputClass}>
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <FormActions onClose={onClose} isBusy={isBusy} submitLabel="Create User" />
            </form>
          ) : (
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input id="first_name" {...editForm.register('first_name')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input id="last_name" {...editForm.register('last_name')} className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input id="phone" {...editForm.register('phone')} className={inputClass} />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                <select id="role" {...editForm.register('role')} className={inputClass} disabled={user.username === 'admin'}>
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  id="is_active"
                  type="checkbox"
                  {...editForm.register('is_active')}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Active account</label>
              </div>
              <FormActions onClose={onClose} isBusy={isBusy} submitLabel="Save Changes" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function FormActions({ onClose, isBusy, submitLabel }: { onClose: () => void; isBusy: boolean; submitLabel: string }) {
  return (
    <div className="flex justify-end space-x-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isBusy}
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isBusy ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}