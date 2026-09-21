import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Coins,
  HardHat,
  Home,
  Layers,
} from 'lucide-react';
import { usePublicProjects, usePublicSite } from '@/features/public/hooks/usePublicSite';
import { ProjectCard } from './components/ProjectCard';
import { SectionHeading } from './components/SectionHeading';

const SERVICES = [
  {
    icon: Home,
    title: 'Residential Development',
    description: 'Housing estates and worker accommodation delivered to quality and on schedule.',
  },
  {
    icon: Building2,
    title: 'Commercial Construction',
    description: 'Offices, retail and mixed-use spaces engineered for longevity.',
  },
  {
    icon: Layers,
    title: 'Project Management',
    description: 'End-to-end planning, costing and contract administration.',
  },
  {
    icon: ClipboardCheck,
    title: 'Quality & Compliance',
    description: 'Site supervision and regulatory certification on every build.',
  },
];

const VALUES = [
  {
    title: 'Built on trust',
    description: 'Transparent costing and clear communication at every milestone.',
  },
  {
    title: 'Local expertise',
    description: 'Deep knowledge of Tanzanian materials, labour and regulations.',
  },
  {
    title: 'On-time delivery',
    description: 'Disciplined schedules and responsive project management.',
  },
];

export function LandingPage() {
  const { data: site, isLoading: siteLoading } = usePublicSite();
  const { data: projects, isLoading: projectsLoading } = usePublicProjects(true);

  const stats = site?.stats;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/bg-construction-1.jpg')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(170deg, rgba(10,16,28,0.96) 0%, rgba(10,16,28,0.82) 55%, rgba(10,16,28,0.9) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-full max-w-3xl"
          style={{ backgroundImage: 'linear-gradient(90deg, rgba(10,16,28,0.95), rgba(10,16,28,0))' }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
            <HardHat className="h-3.5 w-3.5" aria-hidden="true" />
            Constructors &amp; Co.
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl xl:text-6xl">
            Build smarter.
            <br />
            <span className="text-amber-400">Deliver stronger.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            We design and construct housing and staff accommodation that people are proud to call
            home — supported end-to-end by the BuildPay platform.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/projects"
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-3.5 text-sm font-bold text-slate-900 shadow-[0_10px_18px_-8px_rgba(249,168,38,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-300 hover:to-amber-500"
            >
              Explore our projects
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              to="/properties"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-amber-400/50 hover:bg-white/10"
            >
              Browse available homes
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            <span>Projects</span>
            <span className="text-amber-400">·</span>
            <span>People</span>
            <span className="text-amber-400">·</span>
            <span>Costs</span>
            <span className="text-amber-400">·</span>
            <span>Compliance</span>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="border-y border-white/10 bg-[#080d17]">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 divide-y divide-white/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {[
            { label: 'Active & delivered projects', value: stats?.projects, key: 'projects' },
            { label: 'Homes completed', value: stats?.houses, key: 'houses' },
            { label: 'Available to let today', value: stats?.available_houses, key: 'available' },
          ].map((item) => (
            <div key={item.key} className="px-6 py-8 text-center">
              <p className="text-4xl font-extrabold tracking-tight text-amber-400">
                {siteLoading ? '—' : (item.value ?? 0)}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured projects */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Portfolio"
          title="Featured projects"
          subtitle="A selection of estates, apartments and staff housing we are building and have delivered."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projectsLoading ? (
            <p className="text-sm text-slate-400 sm:col-span-2 lg:col-span-3">Loading projects...</p>
          ) : (
            projects?.map((project) => <ProjectCard key={project.id} project={project} />)
          )}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/projects"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-amber-400/50 hover:bg-white/10"
          >
            View all projects
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-white/10 bg-[#080d17]">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we do"
            title="Full-service construction"
            subtitle="From first sketch to final handover, we carry the build."
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-amber-400/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 text-amber-400">
                  <service.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why BuildPay"
          title="Construction you can rely on"
          subtitle="The values behind every site we run."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="p-2">
              <h3 className="text-lg font-bold text-amber-300">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-transparent" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <Coins className="h-8 w-8 text-amber-400" aria-hidden="true" />
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to build together?
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
            Talk to our team about your next project, or apply for one of our available homes today.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-3.5 text-sm font-bold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-300 hover:to-amber-500"
            >
              Request a quote
            </Link>
            <Link
              to="/properties"
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-amber-400/50 hover:bg-white/10"
            >
              Browse homes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}