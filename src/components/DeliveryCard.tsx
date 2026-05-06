import { User, Smartphone, CreditCard, Banknote } from 'lucide-react';
import { Delivery } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import StatusBadge from './StatusBadge';

interface Props {
  delivery: Delivery;
  delay?: number;
}

export default function DeliveryCard({ delivery, delay = 0 }: Props) {
  return (
    <div
      className="glass-card slide-up"
      style={{ padding: '18px 20px', animationDelay: `${delay}ms`, transition: 'transform 0.2s, background 0.2s', cursor: 'default' }}
      onMouseOver={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(17,24,39,0.95)'}
      onMouseOut={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(17,24,39,0.8)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 6 }}>
              #{delivery.id.toUpperCase()}
            </span>
            <StatusBadge status={delivery.delivery_status} size="sm" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--grab-green)', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {delivery.pickup_location}
              </span>
            </div>
            <div style={{ width: 1, height: 12, background: 'var(--border-subtle)', marginLeft: 3 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F87171', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {delivery.dropoff_location}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {delivery.driver_name}</span>
            <span>·</span>
            <span>{formatDate(delivery.booking_time)}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--grab-green)' }}>{formatCurrency(delivery.delivery_fee)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'capitalize', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            {delivery.payment_method === 'ewallet' ? (
              <><Smartphone size={10} /> GrabPay</>
            ) : delivery.payment_method === 'card' ? (
              <><CreditCard size={10} /> Card</>
            ) : (
              <><Banknote size={10} /> Cash</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
