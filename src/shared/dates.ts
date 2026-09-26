const businessDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
export const today = (date = new Date()) => businessDay.format(date);
export function formatDateBr(value?: string | null): string {
  if (!value) return 'N/D';
  // A SQL DATE represents a calendar day, never an instant to shift by a time zone.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('/');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/D' : date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
