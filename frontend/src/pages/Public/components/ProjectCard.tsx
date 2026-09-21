import { Building2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PublicProject } from '@/types/api';
import { formatDate } from '../format';
import { StatusBadge } from './StatusBadge';

export function ProjectCard({ project }: { project: PublicProject }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-[0_20px_45px_-20px_rgba(249,168,38,0.25)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <Building2 className="h-12 w-12 text-amber-400/40" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4">
          <StatusBadge status={project.status} />
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-amber-300">
          {project.name}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-amber-400/70" aria-hidden="true" />
          {project.location}
        </p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400">
          {project.description || 'A Constructors & Co. development.'}
        </p>
        <p className="mt-4 border-t border-white/10 pt-3 text-xs font-medium text-slate-500">
          {formatDate(project.start_date)} — {formatDate(project.expected_completion)}
        </p>
      </div>
    </Link>
  );
}