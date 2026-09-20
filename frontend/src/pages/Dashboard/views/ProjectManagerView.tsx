import { Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  Home,
  KeyRound,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { RevenueTrendChart } from '@/features/dashboard/components/RevenueTrendChart';
import { OccupancyTrendChart } from '@/features/dashboard/components/OccupancyTrendChart';
import { CollectionRateChart } from '@/features/dashboard/components/CollectionRateChart';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import {
  DashboardHeader,
  EmptyMessage,
  Section,
  STATUS_LABELS,
  STATUS_STYLES,
  StatusBadge,
  ViewAllLink,
  formatDate,
} from '../dashboardShared';

export function ProjectManagerView() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) return <LoadingSpinner message="Loading operations..." />;
  if (error) return <ErrorMessage message="Failed to load operations data." onRetry={() => refetch()} />;

  const counts = data?.counts;
  const recent = data?.recent_applications ?? [];

  return (
    <div>
      <DashboardHeader
        title="Operations Dashboard"
        subtitle={
          <>
            Welcome back, <span className="font-medium">{user?.username}</span> — track projects, houses
            and applications in flight.
          </>
        }
        actions={
          <Link
            to="/projects"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Manage Projects
          </Link>
        }
      />

      {counts && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Projects"
            value={counts.projects}
            icon={<Building2 className="h-5 w-5" />}
            iconBg="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            label="Houses"
            value={counts.houses}
            icon={<Home className="h-5 w-5" />}
            iconBg="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Occupied Houses"
            value={counts.occupied_houses}
            icon={<KeyRound className="h-5 w-5" />}
            iconBg="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Applications"
            value={counts.applications}
            icon={<Users className="h-5 w-5" />}
            iconBg="bg-purple-50 text-purple-600"
          />
          <StatCard
            label="Pending Review"
            value={counts.pending_applications}
            valueAccent="text-yellow-600"
            icon={<Clock className="h-5 w-5" />}
            iconBg="bg-yellow-50 text-yellow-600"
          />
          <StatCard
            label="Available Houses"
            value={counts.available_houses}
            valueAccent="text-green-600"
            icon={<ShoppingBag className="h-5 w-5" />}
            iconBg="bg-green-50 text-green-600"
          />
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Analytics</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Revenue Trend">
            <div className="p-5">
              <RevenueTrendChart />
            </div>
          </Section>
          <Section title="Occupancy Trend">
            <div className="p-5">
              <OccupancyTrendChart />
            </div>
          </Section>
          <Section title="Payment Collection Rate" className="lg:col-span-2">
            <div className="p-5">
              <CollectionRateChart />
            </div>
          </Section>
        </div>
      </div>

      <Section
        title="Recent Applications"
        actions={<ViewAllLink to="/applications" />}
      >
        {recent.length === 0 ? (
          <EmptyMessage message="No applications yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    House
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {recent.map((application) => (
                  <tr key={application.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                      {application.house_title || `House #${application.house_id}`}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {application.employee_username || `User #${application.employee_id}`}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge
                        status={application.status}
                        styles={STATUS_STYLES}
                        label={STATUS_LABELS[application.status]}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {formatDate(application.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}