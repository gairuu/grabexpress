interface Props {
  icon: any;
  label: string;
  value: string | number;
  color?: string;
  delay?: number;
}

export default function StatsCard({ icon: Icon, label, value, color = 'var(--grab-green)', delay = 0 }: Props) {
  return (
    <div
      className="slide-up rounded-xl border border-[#e5e7eb] bg-white shadow-sm"
      style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        animationDelay: `${delay}ms`,
        cursor: 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.1)`;
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: color }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );
}
