import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, HardHat, Lock, Mail, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/features/auth/services/authApi';
import { loginSchema, type LoginFormData } from '@/features/auth/validation';
import { getApiErrorMessage } from '@/services/api';

const BACKGROUNDS = [
  '/images/bg-construction-1.jpg',
  '/images/bg-construction-2.jpg',
  '/images/bg-construction-3.jpg',
  '/images/bg-house-1.jpg',
  '/images/bg-house-2.jpg',
  '/images/bg-house-3.jpg',
];

const BG_INTERVAL_MS = 8000;

const DEMO_ACCOUNTS = [
  { label: 'Admin', username: 'admin', password: 'admin123456' },
  { label: 'Project Manager', username: 'pm', password: 'pm123456' },
  { label: 'Finance Officer', username: 'finance', password: 'finance123' },
  { label: 'Employer', username: 'employer', password: 'employer123' },
  { label: 'Brian', username: 'brian', password: 'brian123456' },
  { label: 'Amina', username: 'amina', password: 'amina123456' },
  { label: 'Dorcas', username: 'dorcas', password: 'dorcas123' },
];

export function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    BACKGROUNDS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const id = setInterval(() => setBgIndex((i) => (i + 1) % BACKGROUNDS.length), BG_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
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

  const loginAsDemo = (username: string, password: string) => {
    if (isSubmitting) return;
    setValue('username', username);
    setValue('password', password);
    void onSubmit({ username, password });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden font-sans">
      {/* Fixed full-screen background — darker so authentication stays the focus */}
      <div aria-hidden="true" className="fixed inset-0 -z-10">
        {BACKGROUNDS.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 hidden bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out md:block"
            style={{ backgroundImage: `url(${src})`, opacity: i === bgIndex ? 1 : 0 }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(165deg, rgba(10,16,28,0.94) 0%, rgba(10,16,28,0.8) 55%, rgba(16,24,38,0.88) 100%)',
          }}
        />
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(249,168,38,0.03) 0px, rgba(249,168,38,0.03) 2px, transparent 2px, transparent 26px)',
          }}
        />
      </div>

      <div className="relative flex flex-1 items-center">
        <div className="grid w-full lg:grid-cols-[3fr_2fr]">
          {/* Product identity (desktop only) */}
          <aside className="hidden flex-col justify-between p-12 text-white xl:px-16 lg:flex">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_10px_20px_-8px_rgba(249,168,38,0.55)]">
                <HardHat className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight">BuildPay</h1>
                <div className="mt-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-400">
                  Constructors &amp; Co.
                </div>
              </div>
            </div>

            <div className="max-w-xl">
              <h2 className="mb-4 text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-[2.75rem]">
                Build smarter.
                <br />
                <span className="text-amber-400">Deliver stronger.</span>
              </h2>
              <p className="max-w-md text-base leading-relaxed text-white/75">
                One platform for managing construction operations from planning to handover.
              </p>

              <div className="mt-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                <span>Projects</span>
                <span className="text-amber-400">·</span>
                <span>People</span>
                <span className="text-amber-400">·</span>
                <span>Costs</span>
                <span className="text-amber-400">·</span>
                <span>Compliance</span>
              </div>
            </div>
          </aside>

          {/* Authentication */}
          <main className="flex items-center justify-center p-6 lg:p-10">
            <div className="relative w-full max-w-[400px] overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#0f1a2b]/60 px-8 py-8 shadow-[0_18px_45px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:px-9">
              <div className="absolute left-8 right-8 top-0 h-[3px] rounded-b bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-70" />

              {/* Mobile brand */}
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                  <HardHat className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white">BuildPay</h1>
                  <span className="block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-400">
                    Constructors &amp; Co.
                  </span>
                </div>
              </div>

              {/* Welcome */}
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm font-medium text-white/70">
                Sign in to continue to your BuildPay workspace.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7">
                {serverError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3"
                  >
                    <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-300" />
                    <p className="text-sm font-medium text-red-200">{serverError}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-semibold text-white/80">
                    Username
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder="Enter your username"
                      {...register('username')}
                      className="h-12 w-full rounded-xl border border-white/15 bg-white/10 py-2.5 pl-11 pr-4 text-sm font-medium text-white transition-all duration-200 placeholder:font-normal placeholder:text-white/40 focus:border-amber-400 focus:bg-white/15 focus:outline-none focus:ring-4 focus:ring-amber-400/25"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1.5 text-sm font-medium text-red-300">{errors.username.message}</p>
                  )}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-semibold text-white/80">
                      Password
                    </label>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-xs font-semibold text-amber-300 transition-colors hover:text-amber-200"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register('password')}
                      className="h-12 w-full rounded-xl border border-white/15 bg-white/10 py-2.5 pl-11 pr-12 text-sm font-medium text-white transition-all duration-200 placeholder:font-normal placeholder:text-white/40 focus:border-amber-400 focus:bg-white/15 focus:outline-none focus:ring-4 focus:ring-amber-400/25"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/50 transition-colors hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-sm font-medium text-red-300">{errors.password.message}</p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-white/75">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 cursor-pointer accent-amber-400"
                    />
                    Keep me signed in
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-6 text-sm font-bold text-slate-900 shadow-[0_10px_18px_-8px_rgba(249,168,38,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-300 hover:to-amber-500 hover:shadow-[0_14px_24px_-8px_rgba(249,168,38,0.5)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    'Signing in...'
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <div className="mt-6 text-center">
                  <p className="text-sm font-medium text-white/70">Don&apos;t have a BuildPay account?</p>
                  <Link
                    to="/register"
                    className="mt-1 inline-block text-sm font-bold text-amber-300 transition-colors hover:text-amber-200"
                  >
                    Create an account
                  </Link>
                </div>
              </form>

              {/* Demo accounts */}
              <div className="mt-6 border-t border-white/15 pt-5">
                <p className="mb-3 text-center text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-white/50">
                  Demo accounts
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      disabled={isSubmitting}
                      title={`${account.username} / ${account.password}`}
                      onClick={() => loginAsDemo(account.username, account.password)}
                      className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-xs font-semibold text-white/85 transition-colors hover:border-amber-400/50 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                      {account.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <footer className="relative pb-6 pt-4 text-center text-xs font-medium text-white/50">
        © 2026 BuildPay
      </footer>
    </div>
  );
}