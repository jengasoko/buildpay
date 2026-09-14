import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/dashboard/hooks/useDashboard', () => ({
  useDashboardStats: vi.fn(),
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
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, username: 'admin', role: 'ADMIN' } as never,
      logout: vi.fn(),
    } as never);
    vi.mocked(useDashboardStats).mockReturnValue({
      data: stats,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);
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
});