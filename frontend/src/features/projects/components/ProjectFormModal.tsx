import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectFormSchema, type ProjectFormData } from '../validation';
import { useCreateProject, useUpdateProject } from '../hooks/useProjects';
import type { Project } from '@/types/api';

interface ProjectFormModalProps {
  project?: Project | null;
  onClose: () => void;
}

const toDateTimeLocal = (value: string | null | undefined): string =>
  value ? value.slice(0, 16) : '';

const inputClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';

export function ProjectFormModal({ project, onClose }: ProjectFormModalProps) {
  const isEdit = Boolean(project);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
      start_date: '',
      expected_completion: '',
      actual_completion: '',
    },
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        location: project.location,
        description: project.description ?? '',
        start_date: toDateTimeLocal(project.start_date),
        expected_completion: toDateTimeLocal(project.expected_completion),
        actual_completion: toDateTimeLocal(project.actual_completion),
      });
    }
  }, [project, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    const payload = {
      ...data,
      description: data.description || undefined,
      actual_completion: data.actual_completion || undefined,
    };
    if (isEdit && project) {
      await updateMutation.mutateAsync({ id: project.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  const isBusy = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Project' : 'New Project'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
              ×
            </button>
          </div>

          {mutationError && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <p className="text-sm text-red-700">
                Something went wrong. Please try again.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input id="name" type="text" {...register('name')} className={inputClass} />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input id="location" type="text" {...register('location')} className={inputClass} />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className={inputClass}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  id="start_date"
                  type="datetime-local"
                  {...register('start_date')}
                  className={inputClass}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="expected_completion" className="block text-sm font-medium text-gray-700">
                  Expected Completion
                </label>
                <input
                  id="expected_completion"
                  type="datetime-local"
                  {...register('expected_completion')}
                  className={inputClass}
                />
                {errors.expected_completion && (
                  <p className="mt-1 text-sm text-red-600">{errors.expected_completion.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="actual_completion" className="block text-sm font-medium text-gray-700">
                Actual Completion (optional)
              </label>
              <input
                id="actual_completion"
                type="datetime-local"
                {...register('actual_completion')}
                className={inputClass}
              />
              {errors.actual_completion && (
                <p className="mt-1 text-sm text-red-600">{errors.actual_completion.message}</p>
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
                {isBusy ? 'Saving...' : isEdit ? 'Save changes' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}