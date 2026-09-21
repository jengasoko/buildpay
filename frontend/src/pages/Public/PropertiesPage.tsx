import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { usePublicHouses } from '@/features/public/hooks/usePublicSite';
import { HouseCard } from './components/HouseCard';
import { SectionHeading } from './components/SectionHeading';

export function PropertiesPage() {
  const { data: houses, isLoading, error } = usePublicHouses();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="For rent"
        title="Available homes"
        subtitle="Browse homes currently available across our developments. Apply through your BuildPay account or get in touch."
        align="left"
      />

      <div className="mt-10">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading homes...</p>
        ) : error ? (
          <p className="text-sm text-red-300">Failed to load homes. Please try again later.</p>
        ) : houses?.length === 0 ? (
          <p className="text-sm text-slate-400">No homes are currently available — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {houses?.map((house) => <HouseCard key={house.id} house={house} />)}
          </div>
        )}
      </div>

      <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Found a home you like?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          Applications go through your BuildPay account, or our team can walk you through the process.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-3 text-sm font-bold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-300 hover:to-amber-500"
          >
            Create an account
          </Link>
          <Link
            to="/contact"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-amber-400/50 hover:bg-white/10"
          >
            Talk to our team
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}