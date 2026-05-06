'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import { MapPin, Package, Truck, ShieldCheck, CreditCard, ChevronRight, Info, Bike, Car, Box } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const ITEM_TYPES = ['Documents', 'Food & Beverages', 'Clothing', 'Electronics', 'Fragile Items', 'Others'];
const SIZES = [
  { id: 'S', label: 'S', desc: 'Fits in a small bag', priceMultiplier: 1 },
  { id: 'M', label: 'M', desc: 'Fits in a backpack', priceMultiplier: 1.2 },
  { id: 'L', label: 'L', desc: 'Fits in a motorcycle box', priceMultiplier: 1.5 },
  { id: 'XL', label: 'XL', desc: 'Requires a car/van', priceMultiplier: 2.5 },
];

export default function BookingDetailsPage() {
  const { user, booking, setBooking } = useApp();
  const router = useRouter();
  
  // Local state for the form inputs
  const [senderName, setSenderName] = useState(user?.name || '');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [itemWeight, setItemWeight] = useState(1);
  const [itemType, setItemType] = useState('Documents');
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL'>('S');
  const [selectedVehicle, setSelectedVehicle] = useState<'Motorcycle' | 'Car'>('Motorcycle');
  const [guarantee, setGuarantee] = useState<'basic' | 'standard' | 'premium'>('basic');

  useEffect(() => {
    if (!booking.pickup_location || !booking.dropoff_location) {
      router.push('/book');
    }
  }, [booking, router]);

  // Pricing calculation
  const baseFare = 49;
  const distanceFare = 150; // Mock distance fare
  const sizeMultiplier = SIZES.find(s => s.id === selectedSize)?.priceMultiplier || 1;
  const vehicleExtra = selectedVehicle === 'Car' ? 100 : 0;
  const guaranteePrice = guarantee === 'standard' ? 7 : guarantee === 'premium' ? 9 : 0;
  
  const totalPrice = (baseFare + distanceFare + vehicleExtra) * sizeMultiplier + guaranteePrice;

  const handleBook = () => {
    setBooking({
      sender_name: senderName,
      sender_phone: senderPhone,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      item_size: selectedSize,
      item_weight: itemWeight,
      item_type: itemType,
      vehicle_type: selectedVehicle,
      delivery_fee: totalPrice,
    });
    router.push('/matching');
  };

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#1f2937]">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Form */}
          <div className="flex-1 space-y-6">
            
            {/* Delivery Card Section */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
              <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#111827]">Delivery 1</h2>
                <button className="text-[#9ca3af] hover:text-[#6b7280]">
                  <Box size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Route */}
                <div className="space-y-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9ca3af]">Delivery route</p>
                  
                  <div className="relative pl-8 space-y-12">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 border-l-2 border-dotted border-[#d1d5db]" />
                    
                    {/* Pickup */}
                    <div className="relative">
                      <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center text-white">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <div className="font-bold text-[#111827] mb-3">{booking.pickup_location}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="Who's sending?" 
                          className="grab-input-sm"
                          value={senderName}
                          onChange={e => setSenderName(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="Phone number" 
                          className="grab-input-sm"
                          value={senderPhone}
                          onChange={e => setSenderPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Dropoff */}
                    <div className="relative">
                      <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-[#EF4444] flex items-center justify-center text-white">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <div className="font-bold text-[#111827] mb-3">{booking.dropoff_location}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="Recipient's name" 
                          className="grab-input-sm"
                          value={recipientName}
                          onChange={e => setRecipientName(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="Phone number" 
                          className="grab-input-sm"
                          value={recipientPhone}
                          onChange={e => setRecipientPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Details */}
                <div className="space-y-4 pt-4 border-t border-[#f3f4f6]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9ca3af]">Item details</p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex bg-[#f3f4f6] rounded-lg p-1">
                      {SIZES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSize(s.id as any)}
                          className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${selectedSize === s.id ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6b7280] hover:text-[#111827]'}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center bg-[#f3f4f6] rounded-lg px-3 py-2">
                      <input 
                        type="number" 
                        className="bg-transparent w-12 text-center font-bold text-sm outline-none" 
                        value={itemWeight}
                        onChange={e => setItemWeight(Number(e.target.value))}
                      />
                      <span className="text-[10px] font-bold text-[#9ca3af] ml-1">KG</span>
                    </div>
                    <select 
                      className="bg-[#f3f4f6] rounded-lg px-4 py-2 text-sm font-bold text-[#111827] outline-none border-none focus:ring-0 cursor-pointer"
                      value={itemType}
                      onChange={e => setItemType(e.target.value)}
                    >
                      {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Delivery Options */}
                <div className="space-y-4 pt-4 border-t border-[#f3f4f6]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9ca3af]">Delivery options</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#f3f4f6] border-2 border-transparent cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Package className="text-[#3B82F6]" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827]">Pick up Today</p>
                          <p className="text-[10px] text-[#6b7280]">60 min or less • Instant</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-[#9ca3af]" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#f3f4f6] border-2 border-transparent cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {selectedVehicle === 'Motorcycle' ? <Bike className="text-[#00B14F]" size={20} /> : <Car className="text-[#00B14F]" size={20} />}
                        </div>
                        <select 
                          className="bg-transparent text-sm font-bold text-[#111827] outline-none border-none p-0 cursor-pointer"
                          value={selectedVehicle}
                          onChange={e => setSelectedVehicle(e.target.value as any)}
                        >
                          <option value="Motorcycle">Bike (Deliver via Motor...)</option>
                          <option value="Car">Car (Deliver via Car...)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guarantee */}
                <div className="space-y-4 pt-4 border-t border-[#f3f4f6]">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#9ca3af]">Delivery Guarantee</p>
                    <Info size={14} className="text-[#9ca3af]" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'basic', label: 'Basic', price: 'Included' },
                      { id: 'standard', label: 'Standard', price: '₱7.00' },
                      { id: 'premium', label: 'Premium', price: '₱9.00' }
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setGuarantee(g.id as any)}
                        className={`p-4 rounded-xl text-left transition-all border-2 ${guarantee === g.id ? 'bg-[#00B14F]/5 border-[#00B14F]' : 'bg-[#f3f4f6] border-transparent'}`}
                      >
                        <p className={`text-xs font-bold ${guarantee === g.id ? 'text-[#00B14F]' : 'text-[#111827]'}`}>{g.label}</p>
                        <p className="text-[10px] text-[#6b7280] mt-1">{g.price}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-4 pt-4 border-t border-[#f3f4f6]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9ca3af]">Payment details</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f3f4f6] md:col-span-1">
                      <CreditCard size={18} className="text-[#6b7280]" />
                      <select 
                        className="bg-transparent text-xs font-bold text-[#111827] outline-none border-none p-0 cursor-pointer"
                        value={booking.payment_method}
                        onChange={e => setBooking({ payment_method: e.target.value as any })}
                      >
                        <option value="cash">Cash by Recipient</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="ewallet">GrabPay</option>
                      </select>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Reference code (optional)" 
                      className="grab-input-sm bg-[#f3f4f6] border-transparent"
                    />
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] cursor-pointer hover:bg-[#e5e7eb] transition-colors">
                      <ShieldCheck size={18} className="text-[#FBBF24]" />
                      <span className="text-xs font-bold text-[#111827]">Apply Offers</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Another Button */}
              <button className="w-full py-4 bg-[#f9fafb] text-[#00B14F] font-bold text-sm border-t border-[#e5e7eb] flex items-center justify-center gap-2 hover:bg-[#f3f4f6] transition-colors">
                <span>+</span> Add another delivery
              </button>
            </div>
          </div>

          {/* Right Column: Price Breakdown */}
          <div className="w-full lg:w-[380px]">
            <div className="bg-white rounded-xl shadow-lg border border-[#e5e7eb] sticky top-24 p-6 space-y-6">
              <h2 className="text-base font-bold text-[#111827]">Price breakdown</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[#6b7280]">Delivery 1</span>
                  <span className="text-[#111827]">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-[#e5e7eb] flex justify-between items-center">
                <span className="text-lg font-black text-[#111827]">Total Price</span>
                <span className="text-2xl font-black text-[#111827]">{formatCurrency(totalPrice)}</span>
              </div>

              <button 
                onClick={handleBook}
                className="w-full bg-[#00B14F] hover:bg-[#009940] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#00B14F]/20 grab-glow"
              >
                Book 1 Delivery
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
