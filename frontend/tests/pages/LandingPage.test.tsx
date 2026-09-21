import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from '@/pages/Public/LandingPage';
import { usePublicProjects, usePublicSite } from '@/features/public/hooks/usePublicSite';

vi.mock('@/features/public/hooks/usePublicSite', () => ({
  usePublicSite: vi.fn(),
  usePublicProjects: vi.fn(),
  usePublicProject: vi.fn(),
  usePublicHouses: vi.fn(),
}));

const site = {
  brand_name: 'BuildPay',
  tagline: 'Build smarter. Deliver stronger.',
  stats: { projects: 6, houses: 8, available_houses: 4 },
  contact: { email: 'info@constructors.co.tz', phone: '+255 700 000 000', address: 'Dar es Salaam, Tanzania' },
};

const featured = [
  {
    id: 1,
    name: 'Green Meadows Phase 1',
    location: 'Mbezi Beach, Dar es Salaam',
    description: 'Affordable housing estate.',
    start_date: '2026-01-01T00:00:00Z',
    expected_completion: '2026-12-01T00:00:00Z',
    status: 'ONGOING',
    image_url: '/images/bg-house-1.jpg',
    is_featured: true,
  },
  {
    id: 2,
    name: 'Oyster Bay Executive Villas',
    location: 'Oyster Bay, Dar es Salaam',
    description: 'Bespoke executive villas.',
    start_date: '2025-01-01T00:00:00Z',
    expected_completion: '2026-06-01T00:00:00Z',
    status: 'COMPLETED',
    image_url: null,
    is_featured: true,
  },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.mocked(usePublicSite).mockReturnValue({ data: site, isLoading: false, error: null } as never);
    vi.mocked(usePublicProjects).mockReturnValue({ data: featured, isLoading: false, error: null } as never);
  });

  it('renders the hero headline', () => {
    renderPage();
    expect(screen.getByText('Build smarter.')).toBeInTheDocument();
    expect(screen.getByText('Deliver stronger.')).toBeInTheDocument();
  });

  it('renders live stats from the public site endpoint', () => {
    renderPage();
    expect(screen.getByText('Active & delivered projects')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders featured project cards', () => {
    renderPage();
    expect(screen.getByText('Featured projects')).toBeInTheDocument();
    expect(screen.getByText('Green Meadows Phase 1')).toBeInTheDocument();
    expect(screen.getByText('Oyster Bay Executive Villas')).toBeInTheDocument();
  });

  it('renders service sections and CTAs', () => {
    renderPage();
    expect(screen.getByText('Full-service construction')).toBeInTheDocument();
    expect(screen.getByText('Residential Development')).toBeInTheDocument();
    expect(screen.getByText('Ready to build together?')).toBeInTheDocument();
  });
});