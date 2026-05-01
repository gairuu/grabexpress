'use client';
import { useEffect } from 'react';
import Link from 'next/link';

import { Check } from 'lucide-react';

interface Props {
  onClose?: () => void;
  amount: string;
  method: string;
}

export default function SuccessModal({ onClose, amount, method }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} className="fade-in">
      <div className="glass-card slide-up" style={{ maxWidth: 420, width: '100%', padding: '48px 36px', textAlign: 'center' }}>
        {/* Checkmark */}
        <div className="bounce-in" style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'rgba(0,177,79,0.15)', border: '3px solid var(--grab-green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 0 40px rgba(0,177,79,0.4)',
        }}>
          <Check size={40} className="text-[var(--grab-green)]" strokeWidth={3} />
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Payment Successful!</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Your delivery has been paid successfully.
        </p>

        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 28, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Amount paid</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--grab-green)' }}>{amount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Payment method</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{method}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard" style={{ flex: 1, textDecoration: 'none' }}>
            <button className="btn-primary" style={{ width: '100%' }} onClick={onClose}>
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
