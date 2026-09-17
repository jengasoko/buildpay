import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportsPage } from '@/pages/Reports/ReportsPage';
import { useFinancialReport, useOccupancyReport, useExportFinancialCsv, useExportOccupancyCsv } from '@/features/reports/hooks/useReports';

vi.mock('@/features/reports/hooks/useReports', () => ({
  useFinancialReport: vi.fn(),
  useOccupancyReport: vi.fn(),
  useExportFinancialCsv: vi.fn(),
  useExportOccupancyCsv: vi.fn(),
}));

vi.mock('@/features/dashboard/components/RevenueTrendChart', () => ({
  RevenueTrendChart: () => <div>Revenue Trend Chart Stub</div>,
}));
vi.mock('@/features/dashboard/components/OccupancyTrendChart', () => ({
  OccupancyTrendChart: () => <div>Occupancy Trend Chart Stub</div>,
}));
vi.mock('@/features/dashboard/components/CollectionRateChart', () => ({
  CollectionRateChart: () => <div>Collection Rate Chart Stub</div>,
}));

const financial = {
  month: 9,
  year: 2026,
  collected: 1000.5,
  outstanding: 250.25,
  overdue: 100,
  open_invoices: 3,
  active_leases: 5,
  arrears: [
    { bucket: '0-30', count: 2, amount: 150 },
    { bucket: '90+', count: 1, amount: 175 },
  ],
};

const occupancy = {
  total_houses: 8,
  available_houses: 5,
  occupied_houses: 3,
  active_leases: 3,
  by_house: [
    { house_id: 1, title: 'Unit A1', available: false, occupants: 1 },
    { house_id: 2, title: 'Unit B2', available: true, occupants: 0 },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportsPage />
    </QueryClientProvider>,
  );
}

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFinancialReport).mockReturnValue({
      data: financial,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useOccupancyReport).mockReturnValue({
      data: occupancy,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useExportFinancialCsv).mockReturnValue({
      isExporting: false,
      exportFinancial: vi.fn(),
    } as never);
    vi.mocked(useExportOccupancyCsv).mockReturnValue({
      isExporting: false,
      exportOccupancy: vi.fn(),
    } as never);
  });

  it('renders financial report metrics and arrears', () => {
    renderPage();
    expect(screen.getByText('Financial Report — September 2026')).toBeInTheDocument();
    expect(screen.getByText('$1,000.50')).toBeInTheDocument();
    expect(screen.getAllByText('90+ days').length).toBeGreaterThan(0);
  });

  it('renders occupancy report table', () => {
    renderPage();
    expect(screen.getByText('Occupancy Report')).toBeInTheDocument();
    expect(screen.getByText('Unit A1')).toBeInTheDocument();
    expect(screen.getByText('Unit B2')).toBeInTheDocument();
  });

  it('renders the trends section with chart stubs', () => {
    renderPage();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('Revenue Trend Chart Stub')).toBeInTheDocument();
    expect(screen.getByText('Occupancy Trend Chart Stub')).toBeInTheDocument();
    expect(screen.getByText('Collection Rate Chart Stub')).toBeInTheDocument();
  });

  it('triggers csv export when export buttons are clicked', () => {
    const exportFinancial = vi.fn();
    const exportOccupancy = vi.fn();
    vi.mocked(useExportFinancialCsv).mockReturnValue({
      isExporting: false,
      exportFinancial,
    } as never);
    vi.mocked(useExportOccupancyCsv).mockReturnValue({
      isExporting: false,
      exportOccupancy,
    } as never);

    renderPage();
    const buttons = screen.getAllByText('Export CSV');
    expect(buttons.length).toBe(2);

    fireEvent.click(buttons[0]);
    expect(exportFinancial).toHaveBeenCalledWith(2026, 9);

    fireEvent.click(buttons[1]);
    expect(exportOccupancy).toHaveBeenCalled();
  });
});