import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/api';

const NAV_ITEMS: Array<{ to: string; label: string; roles: UserRole[] }> = [
  { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'EMPLOYER', 'EMPLOYEE'] },
  { to: '/projects', label: 'Projects', roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'EMPLOYER', 'EMPLOYEE'] },
  { to: '/houses', label: 'Houses', roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'EMPLOYER', 'EMPLOYEE'] },
  { to: '/applications', label: 'Applications', roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'EMPLOYER', 'EMPLOYEE'] },
  { to: '/users', label: 'Users', roles: ['ADMIN'] },
  { to: '/payments', label: 'Payments', roles: ['ADMIN', 'FINANCIAL_OFFICER'] },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = user?.role ?? 'EMPLOYEE';
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
                HMS
              </Link>
              <div className="hidden sm:flex space-x-1">
                {visibleItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.to
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user.username} ({user.role.replace('_', ' ')})
                </span>
              )}
              <button
                onClick={logout}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
