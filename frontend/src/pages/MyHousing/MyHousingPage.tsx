import { useApplications } from '@/features/applications/hooks/useApplications';
import { useMyPayments } from '@/features/payments/hooks/usePayments';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import type { Application, ApplicationStatus } from '@/types/api';

const TIMELINE_STEPS: ApplicationStatus[] = ['PENDING', 'EMPLOYER_APPROVED', 'FINANCIAL_APPROVED'];

const STEP_INDEX: Record<ApplicationStatus, number> = {
  PENDING: 0,
  EMPLOYER_APPROVED: 1,
  FINANCIAL_APPROVED: 2,
  REJECTED: 1,
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  EMPLOYER_APPROVED: 'Employer Approved',
  FINANCIAL_APPROVED: 'Financial Approved / Move-in',
  REJECTED: 'Rejected',
};

function JourneyTimeline({ application }: { application: Application }) {
  const currentIndex = STEP_INDEX[application.status];
  const rejected = application.status === 'REJECTED';
  return (
    <div>
      <div className="mb-4">
        <span className="text-lg font-semibold text-gray-900">
          {application.house_title || `House #${application.house_id}`}
        </span>
        <span className="ml-2 text-sm text-gray-500">
          submitted {new Date(application.created_at).toLocaleDateString()}
        </span>
      </div>
      <ol className="flex items-center">
        {TIMELINE_STEPS.map((step, index) => {
          const done = !rejected && index <= currentIndex;
          const active = !rejected && index === currentIndex;
          return (
            <li key={step} className={`flex items-center flex-1 ${index === 0 ? '' : ''}`}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    done
                      ? active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {done && !active ? '✓' : index + 1}
                </div>
                <span className="mt-2 text-xs text-gray-600 text-center">{STATUS_LABELS[step]}</span>
              </div>
              {index < TIMELINE_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 ${index < currentIndex && !rejected ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
      {rejected && (
        <p className="mt-4 text-sm text-red-600">This application was rejected.</p>
      )}
    </div>
  );
}

export function MyHousingPage() {
  const { user } = useAuth();
  const applications = useApplications({ page: 1, page_size: 50 });
  const payments = useMyPayments({ page: 1, page_size: 20 });
  const notifications = useNotifications(10);

  if (applications.isLoading || payments.isLoading) {
    return <LoadingSpinner message="Loading your housing details..." />;
  }

  const myApplications = applications.data?.items ?? [];
  const myPayments = payments.data?.items ?? [];
  const myNotifications = notifications.data?.items ?? [];

  const activeApplication = myApplications.find((a) => a.status === 'FINANCIAL_APPROVED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Housing</h1>
        <p className="text-sm text-gray-500">
          {user?.username} · track your housing application journey
        </p>
      </div>

      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Journey</h2>
        {activeApplication ? (
          <div className="rounded-md bg-green-50 p-4 mb-4">
            <p className="text-sm text-green-800">
              Housing confirmed for <strong>{activeApplication.house_title}</strong>.
              {activeApplication.employer_username && (
                <> Approved by <strong>{activeApplication.employer_username}</strong>.</>
              )}
            </p>
          </div>
        ) : null}
        {myApplications.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven't applied for any houses yet.{' '}
            <Link to="/houses" className="text-indigo-600 hover:underline">
              Browse available houses
            </Link>
          </p>
        ) : (
          <div className="space-y-6">
            {myApplications.map((application) => (
              <JourneyTimeline key={application.id} application={application} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Payments</h2>
          {myPayments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments recorded for you yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {myPayments.map((payment) => (
                <li key={payment.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.application_house_title || `Application #${payment.application_id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.reference || `Ref #${payment.id}`} ·{' '}
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <span className="text-xs text-gray-500">{notifications.data?.total ?? 0} total</span>
          </div>
          {myNotifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {myNotifications.map((notification) => (
                <li key={notification.id} className="py-3">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-xs text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}