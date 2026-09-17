import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  ChartLine,
  Eye,
  EyeOff,
  FolderKanban,
  HardHat,
  Landmark,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  Sun,
  Users,
  Waves,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { loginSchema, type LoginFormData } from '@/features/auth/validation';
import { getApiErrorMessage } from '@/services/api';

const PROJECT_BACKGROUND =
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2400&q=85';

const capabilities = [
  {
    icon: FolderKanban,
    title: 'Project Tracking',
    description: 'Real-time milestones, budgets & site progress in one dashboard.',
  },
  {
    icon: Users,
    title: 'Crew Management',
    description: 'Assign tasks, track hours & certifications across every site.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety Compliance',
    description: 'Automated checklists, incident logs & audit-ready reports.',
  },
  {
    icon: ChartLine,
    title: 'Cost Analytics',
    description: 'Live budget vs. actuals with monthly forecasting trends.',
  },
];

const featuredProjects = [
  {
    icon: Building2,
    className: 'from-amber-500 to-orange-600',
    name: 'Skyline Tower — Phase 2',
    meta: 'Chicago, IL · 82% complete',
  },
  {
    icon: Waves,
    className: 'from-blue-500 to-blue-700',
    name: 'Harbor Bridge Retrofit',
    meta: 'Seattle, WA · 47% complete',
  },
  {
    icon: Sun,
    className: 'from-emerald-500 to-emerald-700',
    name: 'Solaris Business Park',
    meta: 'Austin, TX · 91% complete',
  },
];

export function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      const response = await authApi.login(data);
      await login(response.data.access_token);
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      {/* Fixed full-screen background */}
      <div aria-hidden="true" className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${PROJECT_BACKGROUND})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(15,26,43,0.9) 0%, rgba(15,26,43,0.6) 50%, rgba(30,42,58,0.82) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(249,168,38,0.035) 0px, rgba(249,168,38,0.035) 2px, transparent 2px, transparent 26px)',
          }}
        />
      </div>

      <div className="grid min-h-screen w-full lg:grid-cols-[1.15fr_1fr]">
        {/* Showcase panel */}
        <aside className="hidden flex-col justify-between p-14 text-white lg:flex xl:p-16">
          <div>
            {/* Brand */}
            <div className="mb-14 flex items-center gap-4">
              <div className="flex h-14 w-14 rotate-2 items-center justify-center rounded-[18px] bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_15px_25px_-10px_rgba(249,168,38,0.55)]">
                <HardHat className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
                  BuildPay
                </h1>
                <div className="mt-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-amber-400">
                  Constructors &amp; Co.
                </div>
              </div>
            </div>

            {/* Headline */}
            <h2 className="mb-4 max-w-[560px] text-[2.6rem] font-extrabold leading-[1.15] tracking-tight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.35)]">
              Build smarter.
              <br />
              <span className="text-amber-400">Deliver stronger.</span>
            </h2>
            <p className="mb-10 max-w-[480px] text-lg leading-relaxed text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.3)]">
              The all-in-one platform trusted by 2,400+ construction teams to manage
              projects, crews, and compliance — from breaking ground to handover.
            </p>

            {/* Capability cards */}
            <div className="mb-12 grid max-w-[560px] grid-cols-2 gap-4">
              {capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:bg-white/15 hover:shadow-[0_15px_25px_-10px_rgba(0,0,0,0.45)]"
                >
                  <cap.icon className="mb-3 block h-6 w-6 text-amber-400" />
                  <h3 className="mb-1 text-[0.95rem] font-bold">{cap.title}</h3>
                  <p className="text-[0.78rem] leading-snug text-white/70">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Featured projects */}
          <div>
            <div className="mb-5 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
              <Landmark className="h-4 w-4 text-amber-400" />
              Featured Projects
              <span className="ml-1 h-px flex-1 bg-gradient-to-r from-amber-400/50 to-transparent" />
            </div>

            <div className="flex flex-col gap-3.5">
              {featuredProjects.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center gap-4 rounded-2xl border-l-[3px] border-amber-400 bg-white/5 p-3.5 backdrop-blur-md transition-all duration-200 hover:translate-x-1.5 hover:bg-white/10"
                >
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${project.className} text-white`}
                  >
                    <project.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{project.name}</h4>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-white/65">
                      <MapPin className="h-3 w-3 text-amber-400" />
                      {project.meta}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2.5 border-t border-white/15 pt-5 text-xs font-medium text-white/60">
              <BadgeCheck className="h-4 w-4 text-amber-400" />
              <span>ISO 9001 Certified · 18 Years in Construction Tech</span>
            </div>
          </div>
        </aside>

        {/* Login card */}
        <main className="flex items-center justify-center p-6 lg:p-10">
          <div className="relative w-full max-w-[440px] overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/85 px-8 pb-10 pt-9 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.4)] backdrop-blur-[28px] transition-colors duration-300 hover:bg-white/90 sm:px-10">
            <div className="absolute left-8 right-8 top-0 h-1 rounded-b bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

            {/* Mobile brand */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                <HardHat className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#0f1a2b]">BuildPay</h1>
                <span className="block text-[0.7rem] font-bold uppercase tracking-[0.1em] text-amber-600">
                  Constructors &amp; Co.
                </span>
              </div>
            </div>

            {/* Welcome */}
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-[#0f1a2b]">Sign in</h2>
              <p className="flex items-center gap-2 text-[0.95rem] font-medium text-slate-500">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                Access your project dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {serverError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">{serverError}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-semibold text-[#1e2a3a]">
                    Username
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder="you@buildpay.com"
                      {...register('username')}
                      className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white/85 py-3 pl-11 pr-4 text-[0.95rem] font-medium text-[#0f1a2b] transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/20"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1.5 text-sm font-medium text-red-600">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#1e2a3a]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register('password')}
                      className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white/85 py-3 pl-11 pr-12 text-[0.95rem] font-medium text-[#0f1a2b] transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/20"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-amber-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-sm font-medium text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-7 mt-5 flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-slate-600">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 cursor-pointer accent-amber-500"
                  />
                  Keep me signed in
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm font-semibold text-amber-600 transition-colors hover:text-amber-700"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group mb-7 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#1e2a3a] to-[#0f1a2b] px-6 py-3.5 text-base font-bold text-white shadow-[0_12px_20px_-8px_rgba(15,26,43,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#26374d] hover:to-[#162231] hover:shadow-[0_18px_28px_-8px_rgba(15,26,43,0.55)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in to dashboard'}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <p className="mb-5 text-center text-sm font-medium text-slate-500">
                New to BuildPay?
                <Link
                  to="/register"
                  className="ml-1.5 font-bold text-amber-600 transition-colors hover:text-amber-700"
                >
                  Create an account
                </Link>
              </p>
            </form>

            <div className="flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Secure site access · 24/7 support</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}