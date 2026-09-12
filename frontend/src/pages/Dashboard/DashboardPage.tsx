import { useDashboardData } from '@/features/dashboard/hooks/useDashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuth();
  const { projects, houses } = useDashboardData();

  const isLoading = projects.isLoading || houses.isLoading;
  const error = projects.error || houses.error;

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message="Failed to load dashboard data." />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome back, <span className="font-medium">{user?.username}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
          {projects.data && projects.data.items.length > 0 ? (
            <ul className="space-y-3">
              {projects.data.items.map((project) => (
                <li key={project.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.location}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No projects found.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Houses</h2>
          {houses.data && houses.data.items.length > 0 ? (
            <ul className="space-y-3">
              {houses.data.items.map((house) => (
                <li key={house.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{house.title}</p>
                    <p className="text-sm text-gray-500">${house.rent_price}/mo</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      house.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {house.available ? 'Available' : 'Occupied'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No houses found.</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex space-x-4">
        <Link
          to="/users"
          className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
        >
          Manage Users
        </Link>
        <Link
          to="/payments"
          className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
        >
          View Payments
        </Link>
      </div>
    </div>
  );
}
