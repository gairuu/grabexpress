import { Clock, Truck, Bell, CheckCircle2 } from 'lucide-react';
import { DeliveryStatus } from '@/lib/types';

const STEPS: DeliveryStatus[] = ['pending', 'in_transit', 'arrived', 'delivered'];

const STEP_META: Record<string, { icon: any; label: string; desc: string }> = {
  pending:    { icon: Clock, label: 'Pending',    desc: 'Waiting for driver to start pickup' },
  in_transit: { icon: Truck, label: 'In Transit', desc: 'Driver is on the way' },
  arrived:    { icon: Bell, label: 'Arrived',    desc: 'Driver has arrived at location' },
  delivered:  { icon: CheckCircle2, label: 'Delivered',  desc: 'Package delivered successfully' },
};

interface Props {
  currentStatus: DeliveryStatus;
}

export default function StatusTimeline({ currentStatus }: Props) {
  const currentIndex = STEPS.indexOf(currentStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {STEPS.map((step, i) => {
        const meta = STEP_META[step];
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Timeline line + dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: isDone ? 'var(--grab-green)' : isActive ? 'rgba(0,177,79,0.25)' : '#f3f4f6',
                border: isActive ? '3px solid var(--grab-green)' : isDone ? 'none' : '2px solid #d1d5db',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, transition: 'all 0.4s ease',
                boxShadow: isActive ? '0 0 20px rgba(0,177,79,0.5)' : 'none',
              }}>
                <meta.icon size={20} className={isDone ? 'text-white' : isActive ? 'text-[var(--grab-green)]' : 'text-[#9ca3af]'} />
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 2, height: 40,
                  background: isDone ? 'var(--grab-green)' : '#d1d5db',
                  transition: 'background 0.4s ease',
                }} />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingTop: 8, paddingBottom: i < STEPS.length - 1 ? 24 : 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 700,
                color: isActive ? '#111827' : isDone ? 'var(--grab-green)' : '#9ca3af',
                transition: 'color 0.4s',
              }}>
                {meta.label}
              </div>
              <div style={{
                fontSize: 13, color: isActive ? '#6b7280' : '#9ca3af',
                marginTop: 2, transition: 'color 0.4s',
              }}>
                {meta.desc}
              </div>
              {isActive && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '3px 10px', background: 'rgba(0,177,79,0.1)', borderRadius: 20, border: '1px solid rgba(0,177,79,0.3)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--grab-green)', boxShadow: '0 0 8px rgba(0,177,79,0.8)', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: 11, color: 'var(--grab-green)', fontWeight: 600 }}>Active now</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
