import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateApplication } from '../hooks/useApplications';
import { useHouses } from '@/features/houses/hooks/useHouses';
import { useAuth } from '@/hooks/useAuth';

interface ApplyModalProps {
  onClose: () => void;
}

const applySchema = z.object({
  house_id: z.string().min(1, 'Select a house to apply for'),
});

type ApplyFormData = z.infer<typeof applySchema>;

const inputClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';

export function ApplyModal({ onClose }: ApplyModalProps) {
  const { user } = useAuth();
  const createMutation = useCreateApplication();
  const { data: housesData, isLoading: housesLoading } = useHouses({
    page: 1,
    page_size: 500,
    available_only: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: { house_id: '' },
  });

  const onSubmit = async (data: ApplyFormData) => {
    if (!user) return;
    await createMutation.mutateAsync({
      employee_id: user.id,
      house_id: Number(data.house_id),
    });
    onClose();
  };

  const isBusy = isSubmitting || createMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Apply for a House</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <p className="mt-1 text-sm text-gray-600">
                {user?.username} ({user?.role.replace('_', ' ')})
              </p>
            </div>

            <div>
              <label htmlFor="house_id" className="block text-sm font-medium text-gray-700">
                Available House
              </label>
              <select id="house_id" {...register('house_id')} className={inputClass} disabled={housesLoading}>
                <option value="">Select a house...</option>
                {housesData?.items.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.title} — {house.location} (${house.rent_price}/mo)
                  </option>
                ))}
              </select>
              {housesData && housesData.items.length === 0 && (
                <p className="mt-1 text-sm text-yellow-700">No available houses right now.</p>
              )}
              {errors.house_id && (
                <p className="mt-1 text-sm text-red-600">{errors.house_id.message}</p>
              )}
            </div>

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
                {isBusy ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}