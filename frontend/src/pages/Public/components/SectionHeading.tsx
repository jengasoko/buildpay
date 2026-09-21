interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center' }: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start';
  return (
    <div className={`flex flex-col ${alignment} gap-3`}>
      <span className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">{eyebrow}</span>
      <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
      {subtitle && <p className="max-w-2xl text-base leading-relaxed text-slate-300">{subtitle}</p>}
    </div>
  );
}