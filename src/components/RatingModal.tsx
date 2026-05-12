'use client';
import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Props {
  deliveryId: string;
  driverId: string;
  driverName: string;
  onClose: () => void;
}

export default function RatingModal({ deliveryId, driverId, driverName, onClose }: Props) {
  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);

    try {
      await supabase
        .from('deliveries')
        .update({
          driver_rating: rating,
          customer_review: review.trim() || null
        })
        .eq('id', deliveryId);
    } catch (err) {
      console.error('Rating failed:', err);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="glass-card slide-up" style={{ maxWidth: 460, width: '100%', padding: '36px', textAlign: 'center', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Rate your Driver</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>How was your delivery with <strong>{driverName}</strong>?</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Star size={42} fill={(hovered || rating) >= s ? '#eab308' : 'transparent'} color={(hovered || rating) >= s ? '#eab308' : '#4b5563'} />
            </button>
          ))}
        </div>

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Leave a comment (Optional)"
          rows={3}
          style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: '12px 16px', color: '#fff', marginBottom: 24, resize: 'none' }}
        />

        <button className="btn-primary w-full py-4" disabled={rating === 0 || isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>
    </div>
  );
}
