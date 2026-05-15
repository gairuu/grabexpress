export function calculateFee(pickup: string, dropoff: string): number {
  const base = 49;
  const perChar = 2.5;
  const combined = (pickup.length + dropoff.length) * perChar;
  const raw = base + combined;
  return Math.round(raw / 5) * 5; // round to nearest 5
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}

export function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}
