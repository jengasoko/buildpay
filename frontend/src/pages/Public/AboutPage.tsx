import { Link } from 'react-router-dom';
import { ArrowRight, HardHat, ShieldCheck, Timer, Users } from 'lucide-react';
import { SectionHeading } from './components/SectionHeading';

const PILLARS = [
  {
    icon: Timer,
    title: 'Discipline',
    description: 'Relentless focus on schedule and budget, with honest weekly reporting.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality',
    description: 'Materials, workmanship and handover standards inspected to the letter.',
  },
  {
    icon: Users,
    title: 'People',
    description: 'Skilled crews, transparent employment and housing for the people who build.',
  },
];

export function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="About us"
        title="Constructors & Co., powered by BuildPay"
        subtitle="A Tanzanian construction firm that plans, builds and manages — end to end."
        align="left"
      />

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="leading-relaxed text-slate-300">
            Constructors &amp; Co. has spent years delivering residential estates, staff housing and
            commercial space across the country. Our teams handle everything from feasibility and
            design to site supervision, costing and handover.
          </p>
          <p className="mt-4 leading-relaxed text-slate-300">
            BuildPay is the platform underneath it all — tracking projects, homes, applications,
            payments and compliance in one place so that nothing slips between the cracks.
          </p>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
          <img
            src="/images/bg-construction-2.jpg"
            alt="Construction site at dusk"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 text-amber-400">
              <pillar.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-bold text-white">{pillar.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{pillar.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-amber-400/10 to-transparent p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white">
          <HardHat className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Have a project in mind?</h2>
        <p className="max-w-lg text-sm leading-relaxed text-slate-400">
          Tell us about your site and goals — we will come back with a clear plan and a competitive
          quote.
        </p>
        <Link
          to="/contact"
          className="group mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-3 text-sm font-bold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-300 hover:to-amber-500"
        >
          Start the conversation
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}