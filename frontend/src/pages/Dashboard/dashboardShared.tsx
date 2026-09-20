import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ApplicationStatus, InvoiceStatus, LeaseStatus } from '@/types/api';

export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  EMPLOYER_APPROVED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  FINANCIAL_APPROVED: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  EMPLOYER_APPROVED: 'Employer Approved',
  FINANCIAL_APPROVED: 'Financial Approved',
  REJECTED: 'Rejected',
};

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  OPEN: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  PARTIAL: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  PAID: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  OVERDUE: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  VOID: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
};

export const LEASE_STATUS_STYLES: Record<LeaseStatus, string> = {
  DRAFT: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
  PENDING_SIGNATURE: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  ACTIVE: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  TERMINATED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  EXPIRED: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
};

export function formatMoney(value: number | null | undefined, fractionDigits = 2): string {
  return `$${(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: fractionDigits })}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

export function StatusBadge({
  status,
  styles,
  label,
}: {
  status: string;
  styles: Record<string, string>;
  label?: string;
}) {
  const cls = styles[status] ?? 'bg-gray-50 text-gray-600 ring-1 ring-gray-200';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}

export function DashboardHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm ${className ?? ''}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyMessage({ message }: { message: string }) {
  return <p className="px-5 py-10 text-center text-sm text-gray-500">{message}</p>;
}

export function ViewAllLink({ to }: { to: string }) {
  return (
    <Link to={to} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
      View all
    </Link>
  );
}