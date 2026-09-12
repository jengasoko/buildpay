import { render, screen } from '@testing-library/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'ADMIN' },
    logout: vi.fn(),
  }),
}));

function renderLayout() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MainLayout', () => {
  it('renders navigation links', () => {
    renderLayout();
    expect(screen.getByText('HMS')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('shows username', () => {
    renderLayout();
    expect(screen.getByText(/admin/)).toBeInTheDocument();
  });

  it('renders logout button', () => {
    renderLayout();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
