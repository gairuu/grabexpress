import { Banknote, CreditCard, Smartphone, Check } from 'lucide-react';
import { PaymentMethod } from '@/lib/types';

interface Props {
  method: PaymentMethod;
  selected: boolean;
  onSelect: (m: PaymentMethod) => void;
}

const META: Record<PaymentMethod, { icon: any; label: string; desc: string }> = {
  cash:    { icon: Banknote, label: 'Cash on Delivery', desc: 'Pay when package arrives' },
  card:    { icon: CreditCard, label: 'Credit / Debit Card', desc: 'Visa, Mastercard, JCB' },
  ewallet: { icon: Smartphone, label: 'GrabPay',           desc: 'Pay with your e-wallet balance' },
};

export default function PaymentMethodCard({ method, selected, onSelect }: Props) {
  const meta = META[method];
  return (
    <button
      id={`payment-${method}`}
      onClick={() => onSelect(method)}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        background: selected ? 'rgba(0,177,79,0.08)' : '#ffffff',
        border: `2px solid ${selected ? 'var(--grab-green)' : '#e5e7eb'}`,
        borderRadius: 14, padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'all 0.2s ease',
        boxShadow: selected ? '0 0 20px rgba(0,177,79,0.2)' : 'none',
      }}
    >
      <div style={{ flexShrink: 0, color: selected ? 'var(--grab-green)' : '#6b7280' }}>
        <meta.icon size={28} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{meta.label}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{meta.desc}</div>
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--grab-green)' : '#d1d5db'}`,
        background: selected ? 'var(--grab-green)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {selected && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}
