import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Brand } from './components/Brand';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Our Projects' },
  { to: '/properties', label: 'Properties' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
];

export function PublicSiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? 'text-amber-300' : 'text-slate-300 hover:text-white'
    }`;

  const nav = (
    <nav className="flex flex-col gap-1 lg:flex-row lg:items-center" aria-label="Public navigation">
      {NAV_LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClass} onClick={() => setMenuOpen(false)}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0a101c] font-sans text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a101c]/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />
          <div className="hidden lg:block">{nav}</div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-amber-400/50 hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              to="/contact"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-4 py-2 text-sm font-bold text-slate-900 shadow-[0_10px_18px_-8px_rgba(249,168,38,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-300 hover:to-amber-500"
            >
              Get a quote
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 px-4 py-4 lg:hidden">
            {nav}
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Sign in
              </Link>
              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-4 py-2.5 text-center text-sm font-bold text-slate-900"
              >
                Get a quote
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-[#080d17]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <Brand />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Build smarter. Deliver stronger. One platform for managing construction operations
              from planning to handover.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-slate-400 transition-colors hover:text-amber-300">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/register" className="text-slate-400 transition-colors hover:text-amber-300">
                  Create an account
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Contact</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li>info@constructors.co.tz</li>
              <li>+255 700 000 000</li>
              <li>Dar es Salaam, Tanzania</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs font-medium text-slate-600">
          © 2026 BuildPay — Constructors &amp; Co.
        </div>
      </footer>
    </div>
  );
}