import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePayment, useUpdatePayment } from '../hooks/usePayments';
import { useApplications } from '@/features/applications/hooks/useApplications';
import type { Payment } from '@/types/api';
import { getApiErrorMessage } from '@/services/api';

interface PaymentFormModalProps {
  payment?: Payment;
  onClose: () => void;
}

const paymentSchema = z.object({
  application_id: z.string().optional(),
  amount: z.string().min(1, 'Amount is required'),
  reference: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const inputClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';

export function PaymentFormModal({ payment, onClose }: PaymentFormModalProps) {
  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();
  const { data: applicationsData } = useApplications({ page: 1, page_size: 500 });

  const isCreate = !payment;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: isCreate
      ? { application_id: '', amount: '', reference: '' }
      : {
          application_id: payment.application_id ? String(payment.application_id) : '',
          amount: String(payment.amount),
          reference: payment.reference ?? '',
        },
  });

  const isBusy = createMutation.isPending || updateMutation.isPending;
  const errorMessage = createMutation.error || updateMutation.error
    ? getApiErrorMessage(createMutation.error ?? updateMutation.error)
    : '';

  const onSubmit = async (data: PaymentFormData) => {
    const application_id = data.application_id ? Number(data.application_id) : undefined;
    const reference = data.reference && data.reference.trim() ? data.reference.trim() : undefined;
    if (isCreate) {
      await createMutation.mutateAsync({
        application_id,
        amount: Number(data.amount),
        reference,
      });
    } else {
      await updateMutation.mutateAsync({
        id: payment.id,
        data: {
          amount: Number(data.amount),
          reference,
        },
      });
    }
    onClose();
  };

  const applications = applicationsData?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isCreate ? 'Record Payment' : `Edit Payment #${payment.id}`}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (USD)
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount')}
                className={inputClass}
                placeholder="0.00"
              />
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
            </div>

            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                Reference
              </label>
              <input
                id="reference"
                {...register('reference')}
                className={inputClass}
                placeholder="e.g. Invoice #1023"
              />
            </div>

            {isCreate && (
              <div>
                <label htmlFor="application_id" className="block text-sm font-medium text-gray-700">
                  Application (optional)
                </label>
                <select id="application_id" {...register('application_id')} className={inputClass}>
                  <option value="">No application</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      #{app.id} — {app.house_title} / {app.employee_username}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                {isBusy ? 'Saving...' : isCreate ? 'Record Payment' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}