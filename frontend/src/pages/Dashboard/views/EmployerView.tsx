import { Link } from 'react-router-dom';
import { Clock, Home, KeyRound, TrendingUp, Users, Wrench } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { useEmployerDashboard } from '@/features/dashboard/hooks/useDashboard';
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

export function EmployerView() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useEmployerDashboard();

  if (isLoading) return <LoadingSpinner message="Loading your team..." />;
  if (error) return <ErrorMessage message="Failed to load team data." onRetry={() => refetch()} />;

  const staff = data?.staff;
  const applications = data?.recent_applications ?? [];
  const teamLeases = data?.team_leases ?? [];

  return (
    <div>
      <DashboardHeader
        title="Team & Approvals"
        subtitle={
          <>
            Welcome back, <span className="font-medium">{user?.username}</span> — see how your team
            members are housed and approve their applications.
          </>
        }
        actions={
          <Link
            to="/applications"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Review Applications
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Team Size"
          value={staff?.total ?? 0}
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="With Active Lease"
          value={staff?.with_lease ?? 0}
          valueAccent="text-green-600"
          icon={<KeyRound className="h-5 w-5" />}
          iconBg="bg-green-50 text-green-600"
        />
        <StatCard
          label="Pending Approvals"
          value={staff?.pending_approval ?? 0}
          valueAccent="text-yellow-600"
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          label="Active Leases"
          value={data?.active_leases ?? 0}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Team Houses"
          value={data?.team_houses ?? 0}
          icon={<Home className="h-5 w-5" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Open Maintenance"
          value={data?.open_maintenance ?? 0}
          valueAccent={(data?.open_maintenance ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'}
          icon={<Wrench className="h-5 w-5" />}
          iconBg="bg-red-50 text-red-600"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section
          title="Team Applications"
          actions={<ViewAllLink to="/applications" />}
        >
          {applications.length === 0 ? (
            <EmptyMessage message="No applications from your team yet." />
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
                  {applications.map((application) => (
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

        <Section title="Team Leases">
          {teamLeases.length === 0 ? (
            <EmptyMessage message="No team members with an active lease yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/60">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Employee
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      House
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Start Date
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {teamLeases.map((lease) => (
                    <tr key={`${lease.employee_username}-${lease.house_title}`} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                        {lease.employee_username}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {lease.house_title}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {formatDate(lease.start_date)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <StatusBadge status={lease.status} styles={{}} label={lease.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}