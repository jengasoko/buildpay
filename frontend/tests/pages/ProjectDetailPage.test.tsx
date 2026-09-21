import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectDetailPage } from '@/pages/Public/ProjectDetailPage';
import { usePublicProject } from '@/features/public/hooks/usePublicSite';

vi.mock('@/features/public/hooks/usePublicSite', () => ({
  usePublicSite: vi.fn(),
  usePublicProjects: vi.fn(),
  usePublicProject: vi.fn(),
  usePublicHouses: vi.fn(),
}));

const project = {
  id: 1,
  name: 'Green Meadows Phase 1',
  location: 'Mbezi Beach, Dar es Salaam',
  description: 'Affordable housing estate.',
  start_date: '2026-01-01T00:00:00Z',
  expected_completion: '2026-12-01T00:00:00Z',
  status: 'ONGOING',
  image_url: null,
  is_featured: true,
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/1']}>
        <ProjectDetailPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProjectDetailPage', () => {
  it('renders the project details', () => {
    vi.mocked(usePublicProject).mockReturnValue({ data: project, isLoading: false, error: null } as never);
    renderPage();
    expect(screen.getByText('Green Meadows Phase 1')).toBeInTheDocument();
    expect(screen.getByText('About this project')).toBeInTheDocument();
    expect(screen.getByText('Mbezi Beach, Dar es Salaam')).toBeInTheDocument();
    expect(screen.getByText('All projects')).toBeInTheDocument();
  });

  it('shows a not-found state for missing projects', () => {
    vi.mocked(usePublicProject).mockReturnValue({ data: undefined, isLoading: false, error: new Error('nope') } as never);
    renderPage();
    expect(screen.getByText('Project not found')).toBeInTheDocument();
    expect(screen.getByText('Back to projects')).toBeInTheDocument();
  });
});