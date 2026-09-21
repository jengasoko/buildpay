import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarRange, MapPin } from 'lucide-react';
import { usePublicProject } from '@/features/public/hooks/usePublicSite';
import { formatDate } from './format';
import { StatusBadge } from './components/StatusBadge';
import { SectionHeading } from './components/SectionHeading';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = projectId ? Number(projectId) : undefined;
  const { data: project, isLoading, error } = usePublicProject(id);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-400">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Portfolio"
          title="Project not found"
          subtitle="This project could not be found or is not yet public."
        />
        <Link
          to="/projects"
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-amber-400/50 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-amber-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All projects
      </Link>

      <div className="relative mt-6 aspect-[21/9] overflow-hidden rounded-3xl bg-slate-900">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <Building2 className="h-16 w-16 text-amber-400/40" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="mb-3">
            <StatusBadge status={project.status} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{project.name}</h1>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-xl font-bold text-white">About this project</h2>
          <p className="mt-4 leading-relaxed text-slate-300">
            {project.description || 'A development by Constructors & Co.'}
          </p>

          <div className="mt-10">
            <h2 className="text-xl font-bold text-white">Interested?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Homes in this development are listed on our properties page as they become available.
            </p>
            <Link
              to="/properties"
              className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-3 text-sm font-bold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-300 hover:to-amber-500"
            >
              Browse available homes
              <ArrowLeft className="h-4 w-4 rotate-180 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Location</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-white">
                  <MapPin className="h-4 w-4 text-amber-400/70" aria-hidden="true" />
                  {project.location}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Start</dt>
                <dd className="mt-0.5 font-semibold text-white">{formatDate(project.start_date)}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Expected completion</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-white">
                  <CalendarRange className="h-4 w-4 text-amber-400/70" aria-hidden="true" />
                  {formatDate(project.expected_completion)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
            Want to talk it through?{' '}
            <Link to="/contact" className="font-semibold text-amber-300 transition-colors hover:text-amber-200">
              Contact our team
            </Link>
            .
          </div>
        </aside>
      </div>
    </div>
  );
}