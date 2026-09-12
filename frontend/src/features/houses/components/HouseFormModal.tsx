import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { houseFormSchema, type HouseFormData } from '../validation';
import { useCreateHouse, useUpdateHouse } from '../hooks/useHouses';
import { useProjects } from '@/features/projects/hooks/useProjects';
import type { House } from '@/types/api';

interface HouseFormModalProps {
  house?: House | null;
  onClose: () => void;
}

const inputClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';

export function HouseFormModal({ house, onClose }: HouseFormModalProps) {
  const isEdit = Boolean(house);
  const createMutation = useCreateHouse();
  const updateMutation = useUpdateHouse();
  const { data: projectsData } = useProjects({ page: 1, page_size: 500 });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HouseFormData>({
    resolver: zodResolver(houseFormSchema),
    defaultValues: {
      title: '',
      bedrooms: 0,
      bathrooms: 0,
      area_sqft: 0,
      location: '',
      rent_price: 0,
      price: 0,
      image_url: '',
      available: true,
      project_id: '',
    },
  });

  useEffect(() => {
    if (house) {
      reset({
        title: house.title,
        bedrooms: house.bedrooms,
        bathrooms: house.bathrooms,
        area_sqft: house.area_sqft,
        location: house.location,
        rent_price: house.rent_price,
        price: house.price,
        image_url: house.image_url ?? '',
        available: house.available,
        project_id: house.project_id ? String(house.project_id) : '',
      });
    }
  }, [house, reset]);

  const onSubmit = async (data: HouseFormData) => {
    const payload = {
      ...data,
      image_url: data.image_url || undefined,
      project_id: data.project_id ? Number(data.project_id) : undefined,
    };
    if (isEdit && house) {
      await updateMutation.mutateAsync({ id: house.id, data: payload });
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
              {isEdit ? 'Edit House' : 'New House'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
              ×
            </button>
          </div>

          {mutationError && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <p className="text-sm text-red-700">Something went wrong. Please try again.</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input id="title" type="text" {...register('title')} className={inputClass} />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
                  Bedrooms
                </label>
                <input id="bedrooms" type="number" min={0} {...register('bedrooms', { valueAsNumber: true })} className={inputClass} />
                {errors.bedrooms && (
                  <p className="mt-1 text-sm text-red-600">{errors.bedrooms.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
                  Bathrooms
                </label>
                <input id="bathrooms" type="number" min={0} {...register('bathrooms', { valueAsNumber: true })} className={inputClass} />
                {errors.bathrooms && (
                  <p className="mt-1 text-sm text-red-600">{errors.bathrooms.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="area_sqft" className="block text-sm font-medium text-gray-700">
                  Area (sq ft)
                </label>
                <input id="area_sqft" type="number" step="0.01" min={0} {...register('area_sqft', { valueAsNumber: true })} className={inputClass} />
                {errors.area_sqft && (
                  <p className="mt-1 text-sm text-red-600">{errors.area_sqft.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="rent_price" className="block text-sm font-medium text-gray-700">
                  Rent Price ($)
                </label>
                <input
                  id="rent_price"
                  type="number"
                  step="0.01"
                  min={0}
                  {...register('rent_price', { valueAsNumber: true })}
                  className={inputClass}
                />
                {errors.rent_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.rent_price.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Sale Price ($)
                </label>
                <input id="price" type="number" step="0.01" min={0} {...register('price', { valueAsNumber: true })} className={inputClass} />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                  Project
                </label>
                <select id="project_id" {...register('project_id')} className={inputClass}>
                  <option value="">No project</option>
                  {projectsData?.items.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <input id="image_url" type="text" {...register('image_url')} className={inputClass} />
              {errors.image_url && (
                <p className="mt-1 text-sm text-red-600">{errors.image_url.message}</p>
              )}
            </div>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('available')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Available</span>
            </label>

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
                {isBusy ? 'Saving...' : isEdit ? 'Save changes' : 'Create house'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}