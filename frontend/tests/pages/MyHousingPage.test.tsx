import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MyHousingPage } from '@/pages/MyHousing/MyHousingPage';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/features/applications/hooks/useApplications';
import { useMyPayments } from '@/features/payments/hooks/usePayments';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/features/applications/hooks/useApplications', () => ({ useApplications: vi.fn() }));
vi.mock('@/features/payments/hooks/usePayments', () => ({ useMyPayments: vi.fn() }));
vi.mock('@/features/notifications/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

const application = {
  id: 1,
  employee_id: 5,
  house_id: 1,
  status: 'EMPLOYER_APPROVED',
  created_at: '2026-09-01T10:00:00Z',
  house_title: 'Unit A1',
  employee_username: 'brian',
  employer_username: 'employer',
};

const payment = {
  id: 2,
  application_id: 1,
  amount: 2500,
  payment_date: '2026-09-05T10:00:00Z',
  reference: 'PAY-001',
  created_at: '2026-09-05T10:00:00Z',
  application_house_title: 'Unit A1',
  application_employee_username: 'brian',
};

const notification = {
  id: 3,
  user_id: 5,
  title: 'Application employer-approved',
  message: 'Your application for Unit A1 was approved.',
  is_read: false,
  created_at: '2026-09-02T10:00:00Z',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MyHousingPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('MyHousingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 5, username: 'brian', role: 'EMPLOYEE' } as never,
      logout: vi.fn(),
    } as never);
    vi.mocked(useApplications).mockReturnValue({
      data: { items: [application], total: 1, page: 1, page_size: 50 },
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(useMyPayments).mockReturnValue({
      data: { items: [payment], total: 1, page: 1, page_size: 20 },
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(useNotifications).mockReturnValue({
      data: { items: [notification], total: 1, page: 1, page_size: 10 },
      isLoading: false,
      error: null,
    } as never);
  });

  it('shows the application journey with timeline steps', () => {
    renderPage();
    expect(screen.getByText('My Housing')).toBeInTheDocument();
    expect(screen.getByText('Application Journey')).toBeInTheDocument();
    expect(screen.getAllByText('Unit A1').length).toBeGreaterThan(0);
    expect(screen.getByText('Employer Approved')).toBeInTheDocument();
  });

  it('shows my payments and notifications', () => {
    renderPage();
    expect(screen.getByText('My Payments')).toBeInTheDocument();
    expect(screen.getByText(/PAY-001/)).toBeInTheDocument();
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
    expect(screen.getByText('Application employer-approved')).toBeInTheDocument();
  });
});