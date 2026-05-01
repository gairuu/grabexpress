import { DeliveryStatus } from '@/lib/types';
import { getStatusLabel } from '@/lib/utils';

interface Props {
  status: DeliveryStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const fontSize = size === 'sm' ? 11 : 12;
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';

  return (
    <span
      className={`badge-${status}`}
      style={{ display: 'inline-block', borderRadius: 20, fontSize, fontWeight: 600, padding, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}
    >
      {getStatusLabel(status)}
    </span>
  );
}
