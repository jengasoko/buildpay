import { useState } from 'react';
import { useHouses, useDeleteHouse } from '@/features/houses/hooks/useHouses';
import { HouseFormModal } from '@/features/houses/components/HouseFormModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import type { House } from '@/types/api';

const PAGE_SIZE = 20;

export function HousesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<House | null>(null);
  const { data, isLoading, error, refetch } = useHouses({
    page,
    page_size: PAGE_SIZE,
    available_only: availableOnly,
  });
  const deleteMutation = useDeleteHouse();

  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  if (isLoading) return <LoadingSpinner message="Loading houses..." />;
  if (error) return <ErrorMessage message="Failed to load houses." onRetry={() => refetch()} />;

  const houses = data?.items ?? [];

  const handleEdit = (house: House) => {
    setEditing(house);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleDelete = async (house: House) => {
    if (!window.confirm(`Delete house "${house.title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(house.id);
      toast.success('House deleted');
    } catch {
      toast.error('Failed to delete house. Please try again.');
    }
  };

  const pageCount = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Houses</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} total</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => {
                setAvailableOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Available only</span>
          </label>
          {canManage && (
            <button
              onClick={handleNew}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              New House
            </button>
          )}
        </div>
      </div>

      {houses.length === 0 ? (
        <EmptyState message="No houses found." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beds / Baths
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rent / Sale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {houses.map((house) => (
                <tr key={house.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {house.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {house.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {house.bedrooms} / {house.bathrooms}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {house.area_sqft.toLocaleString()} sq ft
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${house.rent_price.toLocaleString('en-US', { minimumFractionDigits: 2 })} / ${house.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        house.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {house.available ? 'Available' : 'Occupied'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(house)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(house)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Delete
                      </button>
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
                Page {page} of {pageCount}
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

      {modalOpen && <HouseFormModal house={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}