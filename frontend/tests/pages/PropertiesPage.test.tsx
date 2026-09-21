import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropertiesPage } from '@/pages/Public/PropertiesPage';
import { usePublicHouses } from '@/features/public/hooks/usePublicSite';

vi.mock('@/features/public/hooks/usePublicSite', () => ({
  usePublicSite: vi.fn(),
  usePublicProjects: vi.fn(),
  usePublicProject: vi.fn(),
  usePublicHouses: vi.fn(),
}));

const houses = [
  {
    id: 1,
    project_id: 1,
    title: 'Unit A1',
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 1250,
    location: 'Green Meadows, Block A',
    rent_price: 8500,
    price: 1850000,
    image_url: null,
  },
  {
    id: 2,
    project_id: 2,
    title: 'Flat 3C',
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 620,
    location: 'Riverside Heights, Tower 1',
    rent_price: 12000,
    price: 2600000,
    image_url: '/images/bg-house-2.jpg',
  },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PropertiesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PropertiesPage', () => {
  it('renders available homes with price and details', () => {
    vi.mocked(usePublicHouses).mockReturnValue({ data: houses, isLoading: false, error: null } as never);
    renderPage();
    expect(screen.getByText('Available homes')).toBeInTheDocument();
    expect(screen.getByText('Unit A1')).toBeInTheDocument();
    expect(screen.getByText('Flat 3C')).toBeInTheDocument();
    expect(screen.getByText('TSh 8,500')).toBeInTheDocument();
    expect(screen.getByText('3 bd')).toBeInTheDocument();
    expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
  });

  it('shows empty state when no homes are available', () => {
    vi.mocked(usePublicHouses).mockReturnValue({ data: [], isLoading: false, error: null } as never);
    renderPage();
    expect(screen.getByText('No homes are currently available — check back soon.')).toBeInTheDocument();
  });
});