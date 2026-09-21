import { useMemo, useState } from 'react';
import { usePublicProjects } from '@/features/public/hooks/usePublicSite';
import type { ProjectStatus } from '@/types/api';
import { ProjectCard } from './components/ProjectCard';
import { SectionHeading } from './components/SectionHeading';

type Filter = 'ALL' | ProjectStatus;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'ALL', label: 'All projects' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PLANNED', label: 'Planned' },
];

export function ProjectsPage() {
  const { data: projects, isLoading, error } = usePublicProjects(false);
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered = useMemo(
    () => (filter === 'ALL' ? projects : projects?.filter((p) => p.status === filter)) ?? [],
    [projects, filter],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Portfolio"
        title="Our projects"
        subtitle="From first sketches to handover — see what Constructors & Co. is building and has delivered."
        align="left"
      />

      <div className="mt-10 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              filter === item.value
                ? 'border-amber-400/60 bg-amber-500/15 text-amber-300'
                : 'border-white/15 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading projects...</p>
        ) : error ? (
          <p className="text-sm text-red-300">Failed to load projects. Please try again later.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No projects match this filter yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}