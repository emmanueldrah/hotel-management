import { ReactNode } from 'react';
import clsx from 'clsx';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-sm text-slate-400">{message}</div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  OCCUPIED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  RESERVED: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  CLEANING: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  MAINTENANCE: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  OUT_OF_SERVICE: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  CHECKED_IN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  CHECKED_OUT: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  NO_SHOW: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  ISSUED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  DRAFT: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  CLEAN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  DIRTY: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  INSPECTED: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  ASSIGNED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  LOW: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('badge', STATUS_STYLES[status] ?? 'bg-slate-200 text-slate-600')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('card', className)}>{children}</div>;
}
