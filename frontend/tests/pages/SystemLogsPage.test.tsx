import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SystemLogsPage } from '@/pages/SystemLogs/SystemLogsPage';
import { useSystemLogs } from '@/features/system-logs/hooks/useSystemLogs';

vi.mock('@/features/system-logs/hooks/useSystemLogs', () => ({
  useSystemLogs: vi.fn(),
}));

const logs = {
  items: [
    {
      id: 1,
      user_id: 2,
      action: 'APPLICATION.CREATED',
      entity_type: 'APPLICATION',
      entity_id: 9,
      details: '{"house_id": 4}',
      timestamp: '2026-09-01T10:00:00Z',
    },
    {
      id: 2,
      user_id: null,
      action: 'PAYMENT.CREATED',
      entity_type: 'PAYMENT',
      entity_id: 3,
      details: null,
      timestamp: '2026-09-02T10:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  page_size: 20,
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SystemLogsPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('SystemLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSystemLogs).mockReturnValue({
      data: logs,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);
  });

  it('renders log entries with action and entity', () => {
    renderPage();
    expect(screen.getByText('System Logs')).toBeInTheDocument();
    expect(screen.getByText('2 recorded events')).toBeInTheDocument();
    expect(screen.getByText('APPLICATION.CREATED')).toBeInTheDocument();
    expect(screen.getByText('APPLICATION #9')).toBeInTheDocument();
    expect(screen.getByText('PAYMENT.CREATED')).toBeInTheDocument();
  });
});