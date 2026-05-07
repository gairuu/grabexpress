import { Bike, Car, Truck, Box, Phone, Star } from 'lucide-react';
import { Driver } from '@/lib/types';

interface Props {
  driver: Driver;
  compact?: boolean;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star 
          key={i} 
          size={14} 
          fill={i <= Math.round(rating) ? '#FBBF24' : 'transparent'} 
          color={i <= Math.round(rating) ? '#FBBF24' : '#374151'} 
        />
      ))}
      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4, fontWeight: 600 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function DriverCard({ driver, compact = false }: Props) {
  const VehicleIcon = driver.vehicle === 'Motorcycle' ? Bike : driver.vehicle === 'Car' ? Car : Truck;

  return (
    <div
      className="slide-in-right rounded-xl border border-[#e5e7eb] bg-white shadow-sm"
      style={{ padding: compact ? '16px 18px' : '24px', display: 'flex', alignItems: compact ? 'center' : 'flex-start', gap: 16 }}
    >
      {/* Avatar */}
      <div className="bg-[#00B14F]" style={{
        width: compact ? 48 : 64, height: compact ? 48 : 64,
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: compact ? 18 : 22, fontWeight: 800, color: '#fff', flexShrink: 0,
      }}>
        {driver.avatar}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: compact ? 15 : 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{driver.name}</div>
        <Stars rating={driver.rating} />
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: compact ? 8 : 12 }}>
          <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
            <VehicleIcon size={14} /> {driver.vehicle}
          </span>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: 6 }}>
            {driver.plate_number}
          </span>
          {!compact && (
            <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Box size={14} /> {driver.totalDeliveries.toLocaleString()} deliveries
            </span>
          )}
        </div>
        {!compact && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#00B14F', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={14} /> {driver.contact_number}
          </div>
        )}
      </div>

      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: '#00B14F', 
            boxShadow: '0 0 8px rgba(0,177,79,0.7)',
          }} />
          <span style={{ fontSize: 12, color: '#00B14F', fontWeight: 700 }}>
            {driver.status === 'available' ? 'Available' : 'Active'}
          </span>
        </div>
      )}
    </div>
  );
}
