import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OccupanciesPage } from '@/pages/Occupancies/OccupanciesPage';
import { useAuth } from '@/hooks/useAuth';
import { useOccupancies, useEndOccupancy } from '@/features/occupancies/hooks/useOccupancies';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/features/occupancies/hooks/useOccupancies', () => ({
  useOccupancies: vi.fn(),
  useEndOccupancy: vi.fn(),
}));

const occupancy = {
  id: 1,
  application_id: 3,
  house_id: 4,
  employee_id: 7,
  started_at: '2026-08-20T10:00:00Z',
  ended_at: null,
  house_title: 'Unit B2',
  employee_username: 'dorcas',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <OccupanciesPage />
      </QueryClientProvider>
    </ToastProvider>,
  );
}

describe('OccupanciesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, username: 'admin', role: 'ADMIN' } as never,
      logout: vi.fn(),
    } as never);
    vi.mocked(useOccupancies).mockReturnValue({
      data: { items: [occupancy], total: 1, page: 1, page_size: 20 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useEndOccupancy).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
  });

  it('renders occupancy rows', () => {
    renderPage();
    expect(screen.getByText('Occupancies')).toBeInTheDocument();
    expect(screen.getByText('Unit B2')).toBeInTheDocument();
    expect(screen.getByText('dorcas')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows a move-out action for active occupancies as admin', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Move out' })).toBeInTheDocument();
  });
});