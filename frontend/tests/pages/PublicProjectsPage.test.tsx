import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectsPage } from '@/pages/Public/ProjectsPage';
import { usePublicProjects } from '@/features/public/hooks/usePublicSite';

vi.mock('@/features/public/hooks/usePublicSite', () => ({
  usePublicSite: vi.fn(),
  usePublicProjects: vi.fn(),
  usePublicProject: vi.fn(),
  usePublicHouses: vi.fn(),
}));

const projects = [
  {
    id: 1,
    name: 'Green Meadows Phase 1',
    location: 'Mbezi Beach, Dar es Salaam',
    description: 'Affordable housing estate.',
    start_date: '2026-01-01T00:00:00Z',
    expected_completion: '2026-12-01T00:00:00Z',
    status: 'ONGOING',
    image_url: null,
    is_featured: true,
  },
  {
    id: 2,
    name: 'Oyster Bay Executive Villas',
    location: 'Oyster Bay, Dar es Salaam',
    description: 'Bespoke villas.',
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
        <ProjectsPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('Public ProjectsPage', () => {
  beforeEach(() => {
    vi.mocked(usePublicProjects).mockReturnValue({ data: projects, isLoading: false, error: null } as never);
  });

  it('renders all projects', () => {
    renderPage();
    expect(screen.getByText('Our projects')).toBeInTheDocument();
    expect(screen.getByText('Green Meadows Phase 1')).toBeInTheDocument();
    expect(screen.getByText('Oyster Bay Executive Villas')).toBeInTheDocument();
  });

  it('renders status badges with human labels', () => {
    renderPage();
    expect(screen.getAllByText('Ongoing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
  });

  it('filters projects by status', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.getByText('Oyster Bay Executive Villas')).toBeInTheDocument();
    expect(screen.queryByText('Green Meadows Phase 1')).not.toBeInTheDocument();
  });

  it('shows empty state when no projects match', () => {
    vi.mocked(usePublicProjects).mockReturnValue({ data: [projects[0]], isLoading: false, error: null } as never);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.getByText('No projects match this filter yet.')).toBeInTheDocument();
  });
});