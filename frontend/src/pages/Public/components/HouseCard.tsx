import { Bath, BedDouble, Home, MapPin, Ruler } from 'lucide-react';
import type { PublicHouse } from '@/types/api';
import { formatMoney } from '../format';

export function HouseCard({ house }: { house: PublicHouse }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-[0_20px_45px_-20px_rgba(249,168,38,0.25)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        {house.image_url ? (
          <img
            src={house.image_url}
            alt={house.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <Home className="h-12 w-12 text-amber-400/40" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          Available
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold tracking-tight text-white">{house.title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-amber-400/70" aria-hidden="true" />
          {house.location}
        </p>

        <div className="mt-4 flex items-center gap-4 text-sm text-slate-300">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-amber-400/70" aria-hidden="true" />
            {house.bedrooms} bd
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-amber-400/70" aria-hidden="true" />
            {house.bathrooms} ba
          </span>
          <span className="flex items-center gap-1.5">
            <Ruler className="h-4 w-4 text-amber-400/70" aria-hidden="true" />
            {house.area_sqft.toLocaleString()} sq ft
          </span>
        </div>

        <p className="mt-4 border-t border-white/10 pt-4">
          <span className="text-2xl font-extrabold tracking-tight text-amber-300">
            {formatMoney(house.rent_price)}
          </span>
          <span className="text-sm font-medium text-slate-400"> / month</span>
        </p>
      </div>
    </div>
  );
}