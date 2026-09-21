import { HardHat } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BrandProps {
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link to="/" className="group flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_10px_20px_-8px_rgba(249,168,38,0.55)] transition-transform duration-200 group-hover:scale-105">
        <HardHat className="h-5 w-5" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight text-white">BuildPay</span>
          <span className="block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-400">
            Constructors &amp; Co.
          </span>
        </span>
      )}
    </Link>
  );
}