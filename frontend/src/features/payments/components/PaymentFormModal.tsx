import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePayment, useUpdatePayment } from '../hooks/usePayments';
import { useApplications } from '@/features/applications/hooks/useApplications';
import { useInvoices } from '@/features/invoices/hooks/useInvoices';
import { useToast } from '@/components/ui/Toast';
import type { Payment, PaymentMethod } from '@/types/api';
import { getApiErrorMessage } from '@/services/api';

interface PaymentFormModalProps {
  payment?: Payment;
  onClose: () => void;
}

const paymentSchema = z.object({
  application_id: z.string().optional(),
  invoice_id: z.string().optional(),
  amount: z.string().min(1, 'Amount is required'),
  method: z.string().optional(),
  reference: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const inputClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';

const METHODS: PaymentMethod[] = ['CASH', 'EFT', 'CARD', 'PAYROLL_DEDUCTION'];

export function PaymentFormModal({ payment, onClose }: PaymentFormModalProps) {
  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();
  const { data: applicationsData } = useApplications({ page: 1, page_size: 500 });
  const { data: invoicesData } = useInvoices({ page: 1, page_size: 500 });
  const toast = useToast();

  const isCreate = !payment;
  const hasInvoice = isCreate ? false : !!payment.invoice_id;

  const [applyTo, setApplyTo] = useState<'invoice' | 'application'>(
    hasInvoice ? 'invoice' : 'invoice',
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: isCreate
      ? { application_id: '', invoice_id: '', amount: '', method: 'CASH', reference: '' }
      : {
          application_id: payment.application_id ? String(payment.application_id) : '',
          invoice_id: payment.invoice_id ? String(payment.invoice_id) : '',
          amount: String(payment.amount),
          method: payment.method ?? 'CASH',
          reference: payment.reference ?? '',
        },
  });

  const isBusy = createMutation.isPending || updateMutation.isPending;
  const errorMessage = createMutation.error || updateMutation.error
    ? getApiErrorMessage(createMutation.error ?? updateMutation.error)
    : '';

  const onSubmit = async (data: PaymentFormData) => {
    const reference = data.reference && data.reference.trim() ? data.reference.trim() : undefined;
    const method = (data.method as PaymentMethod) || 'CASH';
    try {
      if (isCreate) {
        if (applyTo === 'invoice') {
          await createMutation.mutateAsync({
            invoice_id: data.invoice_id ? Number(data.invoice_id) : undefined,
            amount: Number(data.amount),
            method,
            reference,
          });
        } else {
          await createMutation.mutateAsync({
            application_id: data.application_id ? Number(data.application_id) : undefined,
            amount: Number(data.amount),
            method,
            reference,
          });
        }
        toast.success('Payment recorded successfully');
      } else {
        await updateMutation.mutateAsync({
          id: payment.id,
          data: {
            amount: Number(data.amount),
            method,
            reference,
          },
        });
        toast.success(`Payment #${payment.id} updated`);
      }
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const applications = applicationsData?.items ?? [];
  const openInvoices = (invoicesData?.items ?? []).filter(
    (inv) => inv.status === 'OPEN' || inv.status === 'PARTIAL',
  );

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
            {isCreate && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Apply to</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setApplyTo('invoice')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md border ${
                      applyTo === 'invoice'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyTo('application')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border-t border-b border-r ${
                      applyTo === 'application'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Application
                  </button>
                </div>
              </div>
            )}

            {isCreate && applyTo === 'invoice' && (
              <div>
                <label htmlFor="invoice_id" className="block text-sm font-medium text-gray-700">
                  Invoice
                </label>
                <select id="invoice_id" {...register('invoice_id')} className={inputClass}>
                  <option value="">Select an invoice</option>
                  {openInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      #{inv.id} — {inv.house_title} (due ${inv.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isCreate && applyTo === 'application' && (
              <div>
                <label htmlFor="application_id" className="block text-sm font-medium text-gray-700">
                  Application
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

            {!isCreate && payment.invoice_id && (
              <div>
                <label htmlFor="invoice_id" className="block text-sm font-medium text-gray-700">
                  Invoice
                </label>
                <select id="invoice_id" {...register('invoice_id')} className={inputClass}>
                  <option value={payment.invoice_id}>#{payment.invoice_id}</option>
                  {openInvoices
                    .filter((inv) => inv.id !== payment.invoice_id)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        #{inv.id} — {inv.house_title} (due ${inv.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {!isCreate && !payment.invoice_id && (
              <div>
                <label htmlFor="application_id" className="block text-sm font-medium text-gray-700">
                  Application
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
              <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                Method
              </label>
              <select id="method" {...register('method')} className={inputClass}>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace('_', ' ')}
                  </option>
                ))}
              </select>
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
