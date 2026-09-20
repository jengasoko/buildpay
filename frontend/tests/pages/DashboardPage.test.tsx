import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { useAuth } from '@/hooks/useAuth';
import {
  useCollectionRate,
  useDashboardStats,
  useEmployerDashboard,
  useFinancialDashboard,
  useOccupancyTrend,
  useRevenueTrend,
} from '@/features/dashboard/hooks/useDashboard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/dashboard/hooks/useDashboard', () => ({
  useDashboardStats: vi.fn(),
  useEmployeeDashboard: vi.fn(),
  useEmployerDashboard: vi.fn(),
  useFinancialDashboard: vi.fn(),
  useRevenueTrend: vi.fn(),
  useOccupancyTrend: vi.fn(),
  useCollectionRate: vi.fn(),
}));

const stats = {
  counts: {
    users: 10,
    employees: 6,
    employers: 1,
    projects: 7,
    houses: 8,
    available_houses: 5,
    occupied_houses: 3,
    applications: 4,
    pending_applications: 2,
    employer_approved_applications: 1,
    financial_approved_applications: 1,
    rejected_applications: 0,
    payments: 3,
  },
  total_payment_amount: 1250.5,
  recent_applications: [
    {
      id: 1,
      employee_id: 11,
      house_id: 4,
      status: 'PENDING',
      created_at: '2026-09-01T10:00:00Z',
      house_title: 'Unit A1',
      employee_username: 'brian',
    },
  ],
};

const financial = {
  month: 9,
  year: 2026,
  collected_this_month: 500.5,
  collected_all_time: 3000,
  outstanding: 120,
  overdue: 30,
  collection_rate: 90,
  open_invoices: 2,
  active_leases: 1,
  recent_payments: [
    {
      id: 1,
      reference: 'R-1',
      amount: 200,
      payment_date: '2026-09-02T10:00:00Z',
      application_employee_username: 'brian',
      application_house_title: 'Unit A1',
    },
  ],
  arrears: [{ bucket: 'current', count: 0, amount: 0 }],
};

const employer = {
  staff: { total: 3, with_lease: 2, pending_approval: 1 },
  team_houses: 2,
  active_leases: 2,
  pending_applications: 1,
  open_maintenance: 0,
  recent_applications: [],
  team_leases: [
    {
      employee_username: 'brian',
      house_title: 'Unit A1',
      room_number: null,
      start_date: '2026-01-01T00:00:00Z',
      status: 'ACTIVE',
    },
  ],
};

function mockHooks(role: string) {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 1, username: 'admin', role } as never,
    logout: vi.fn(),
  } as never);
  vi.mocked(useDashboardStats).mockReturnValue({
    data: stats,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as never);
  vi.mocked(useEmployerDashboard).mockReturnValue({
    data: employer,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as never);
  vi.mocked(useFinancialDashboard).mockReturnValue({
    data: financial,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as never);
  vi.mocked(useRevenueTrend).mockReturnValue({
    data: { data: [{ month: '2026-09', value: 500 }] },
    isLoading: false,
    error: null,
  } as never);
  vi.mocked(useOccupancyTrend).mockReturnValue({
    data: { data: [{ month: '2026-09', occupied: 3, total: 8 }] },
    isLoading: false,
    error: null,
  } as never);
  vi.mocked(useCollectionRate).mockReturnValue({
    data: {
      data: [{ month: '2026-09', invoiced: 1000, collected: 500, rate: 50 }],
    },
    isLoading: false,
    error: null,
  } as never);
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHooks('ADMIN');
  });

  it('renders stat cards from the stats endpoint', async () => {
    renderPage();
    expect(await screen.findByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Available Houses')).toBeInTheDocument();
    expect(screen.getByText('$1,250.50')).toBeInTheDocument();
  });

  it('shows recent applications', () => {
    renderPage();
    expect(screen.getByText('Recent Applications')).toBeInTheDocument();
    expect(screen.getByText('Unit A1')).toBeInTheDocument();
    expect(screen.getByText('brian')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders analytics charts for admin role', async () => {
    renderPage();
    expect(await screen.findByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    expect(screen.getByText('Occupancy Trend')).toBeInTheDocument();
    expect(screen.getByText('Payment Collection Rate')).toBeInTheDocument();
  });

  it('renders operations dashboard for project manager', () => {
    mockHooks('PROJECT_MANAGER');
    renderPage();
    expect(screen.getByText('Operations Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('renders finance dashboard for financial officer', () => {
    mockHooks('FINANCIAL_OFFICER');
    renderPage();
    expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Collected This Month')).toBeInTheDocument();
    expect(screen.getByText('Outstanding')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('R-1')).toBeInTheDocument();
  });

  it('renders team dashboard for employer', () => {
    mockHooks('EMPLOYER');
    renderPage();
    expect(screen.getByText('Team & Approvals')).toBeInTheDocument();
    expect(screen.getByText('Team Size')).toBeInTheDocument();
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
    expect(screen.getByText('brian')).toBeInTheDocument();
    expect(screen.getByText('Unit A1')).toBeInTheDocument();
  });
});