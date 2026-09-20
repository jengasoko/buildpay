import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  HardHat,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/api';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'EMPLOYER', 'EMPLOYEE'] },
  { to: '/my-housing', label: 'My Housing', icon: KeyRound, roles: ['EMPLOYEE'] },
  { to: '/projects', label: 'Projects', icon: Building2, roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER'] },
  { to: '/houses', label: 'Houses', icon: Home, roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'EMPLOYER', 'EMPLOYEE'] },
  { to: '/applications', label: 'Applications', icon: ClipboardList, roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'EMPLOYER', 'EMPLOYEE'] },
  { to: '/occupancies', label: 'Occupancies', icon: CalendarCheck, roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'EMPLOYER'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { to: '/payments', label: 'Payments', icon: CreditCard, roles: ['ADMIN', 'FINANCIAL_OFFICER'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'EMPLOYER', 'EMPLOYEE'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER'] },
  { to: '/system-logs', label: 'System Logs', icon: ScrollText, roles: ['ADMIN', 'PROJECT_MANAGER'] },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm">
        <HardHat className="h-5 w-5" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-white">BuildPay</span>
      )}
    </Link>
  );
}

export function MainLayout() {
  const { user, logout } = useAuth();
  const role = user?.role ?? 'EMPLOYEE';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const sidebarFooter = (
    <div className="border-t border-white/10 p-4">
      {user && (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.username}</p>
            <p className="truncate text-xs text-slate-400">{user.role.replace(/_/g, ' ')}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/dashboard" className="text-lg font-bold tracking-tight text-slate-900 lg:hidden">
            BuildPay
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationBell />
          {user && (
            <span className="hidden rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 sm:inline">
              {user.username}
            </span>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-900 lg:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
        {nav}
        {sidebarFooter}
      </aside>

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900">
            <div className="flex h-16 items-center justify-between px-5">
              <Brand />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {sidebarFooter}
          </aside>
        </>
      )}

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}