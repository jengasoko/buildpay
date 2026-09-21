export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-TZ', {
    month: 'short',
    year: 'numeric',
  });
}

export function formatMoney(value: number | null | undefined): string {
  const amount = (value ?? 0).toLocaleString('en-TZ');
  return `TSh ${amount}`;
}