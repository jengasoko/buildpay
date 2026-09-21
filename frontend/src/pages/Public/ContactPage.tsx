import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { usePublicSite } from '@/features/public/hooks/usePublicSite';
import { useToast } from '@/components/ui/Toast';
import { SectionHeading } from './components/SectionHeading';

export function ContactPage() {
  const { data: site } = usePublicSite();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const contact = site?.contact;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    toast.success('Message received. Our team will be in touch shortly.');
    setForm({ name: '', email: '', message: '' });
  };

  const inputClass =
    'h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white placeholder:font-normal placeholder:text-white/40 focus:border-amber-400 focus:bg-white/15 focus:outline-none focus:ring-4 focus:ring-amber-400/25';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Contact"
        title="Talk to our team"
        subtitle="Questions about a project, a home, or partnering with us? Drop us a line."
        align="left"
      />

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-white/80">
                Your name
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. John Mwangi"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="mt-5">
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-white/80">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="mt-5">
              <label htmlFor="message" className="mb-2 block text-sm font-semibold text-white/80">
                Your message
              </label>
              <textarea
                id="message"
                required
                rows={5}
                placeholder="Tell us about your project or the home you are looking for..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white placeholder:font-normal placeholder:text-white/40 focus:border-amber-400 focus:bg-white/15 focus:outline-none focus:ring-4 focus:ring-amber-400/25"
              />
            </div>
            <button
              type="submit"
              className="mt-6 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-3 text-sm font-bold text-slate-900 shadow-[0_10px_18px_-8px_rgba(249,168,38,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-300 hover:to-amber-500"
            >
              Send message
            </button>
            {submitted && (
              <p className="mt-4 text-sm font-medium text-emerald-300">
                Thanks for reaching out — we will reply soon.
              </p>
            )}
          </form>
        </div>

        <aside>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Reach us</h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" aria-hidden="true" />
                <span className="text-white">{contact?.email ?? 'info@constructors.co.tz'}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" aria-hidden="true" />
                <span className="text-white">{contact?.phone ?? '+255 700 000 000'}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" aria-hidden="true" />
                <span className="text-white">{contact?.address ?? 'Dar es Salaam, Tanzania'}</span>
              </li>
            </ul>
            <p className="mt-6 text-sm text-slate-400">
              Already a tenant or employer? Sign in to manage your application, lease and payments
              from the dashboard.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}