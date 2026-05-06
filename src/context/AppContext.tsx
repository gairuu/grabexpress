'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppUser, BookingState, Delivery, DeliveryStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface AppContextType {
  user: AppUser | null;
  loading: boolean;
  deliveries: Delivery[];
  booking: BookingState;
  signUp: (email: string, password: string, name: string, role: AppUser['role']) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchDeliveries: () => Promise<void>;
  addDelivery: (d: Omit<Delivery, 'id'>) => Promise<string>;
  updateDelivery: (deliveryId: string, updates: Partial<Delivery>) => Promise<void>;
  updateDeliveryStatus: (deliveryId: string, status: DeliveryStatus) => Promise<void>;
  findAvailableDriver: () => Promise<any>;
  setBooking: (b: Partial<BookingState>) => void;
  resetBooking: () => void;
}

const defaultBooking: BookingState = {
  id: '',
  pickup: '',
  dropoff: '',
  fee: 0,
  driver: null,
  status: 'pending',
  paymentMethod: 'cash',
  senderName: '',
  senderPhone: '',
  recipientName: '',
  recipientPhone: '',
  itemSize: 'S',
  itemWeight: 1,
  itemType: 'Documents',
  vehicleType: 'Motorcycle',
};

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [booking, setBookingState] = useState<BookingState>(defaultBooking);

  // ── Fetch profile from Supabase ──
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('Profile missing or error fetching:', error?.message);
      return null;
    }

    const appUser: AppUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      avatar: data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      role: data.role,
    };

    if (data.role === 'driver') {
      appUser.linkedDriverId = data.id;
    }

    return appUser;
  }, []);

  // ── Listen to auth state changes ──
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setDeliveries([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);


  // ── Auth functions ──
  const signUp = useCallback(async (email: string, password: string, name: string, role: AppUser['role']) => {
    try {
      console.log('Starting signUp process for:', email, role);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });

      console.log('Supabase signUp response:', { user: data.user?.id, error });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'Signup failed. Please try again.' };

      console.log('Forcing profile update...');
      // Force update the profile to ensure the trigger didn't default it to customer
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ role, name })
        .eq('id', data.user.id);
        
      if (profileUpdateError) {
        console.error("Failed to force update profile role:", profileUpdateError);
      } else {
        console.log('Profile update successful');
      }

      // If driver, create drivers row
      if (role === 'driver') {
        console.log('Creating driver record...');
        const { error: driverError } = await supabase.from('drivers').insert({
          id: data.user.id,
          vehicle_type: 'Motorcycle',
          plate_number: 'TBD',
          rating: 5.0,
          is_available: true,
        });
        
        if (driverError) {
          console.error("Failed to create driver record:", driverError);
        } else {
          console.log('Driver record created successfully');
        }
      }

      console.log('Setting user state and finishing...');
      // Set user immediately so we don't need to wait for onAuthStateChange
      setUser({
        id: data.user.id,
        name,
        email,
        avatar: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        role,
        ...(role === 'driver' ? { linkedDriverId: data.user.id } : {}),
      });

      return { error: null };
    } catch (err: any) {
      console.error('Unexpected signUp error:', err);
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('Starting signIn process for:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('SignIn error:', error.message);
      return { error: error.message };
    }
    console.log('SignIn successful');
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) console.error('Google Sign In Error:', error.message);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase signOut error:", error);
    } finally {
      setUser(null);
      setDeliveries([]);
      setBookingState(defaultBooking);
    }
  }, []);

  // ── Delivery functions ──
  const fetchDeliveries = useCallback(async () => {
    if (!user) return;

    let query = supabase.from('deliveries').select('*').order('created_at', { ascending: false });

    // Admin sees all, customer sees their own, driver sees assigned
    if (user.role === 'customer') {
      query = query.eq('customer_id', user.id);
    } else if (user.role === 'driver') {
      query = query.eq('driver_id', user.id);
    }
    // admin: no filter (RLS handles it)

    const { data, error } = await query;

    if (!error && data) {
      const mapped: Delivery[] = data.map((row) => ({
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customer_name || 'Unknown',
        driverId: row.driver_id || '',
        driverName: row.driver_name || 'Unassigned',
        pickup: row.pickup_location,
        dropoff: row.dropoff_location,
        status: row.status,
        fee: Number(row.fee),
        paymentMethod: row.payment_method,
        createdAt: row.created_at,
        estimatedTime: row.estimated_time || '',
        senderName: row.sender_name,
        senderPhone: row.sender_phone,
        recipientName: row.recipient_name,
        recipientPhone: row.recipient_phone,
        itemSize: row.item_size,
        itemWeight: row.item_weight,
        itemType: row.item_type,
        vehicleType: row.vehicle_type,
      }));
      setDeliveries(mapped);
    }
  }, [user]);

  // ── Set up Realtime listener ──
  useEffect(() => {
    if (!user) return;

    fetchDeliveries();

    // Set up Realtime subscription for "instant" updates
    const channel = supabase
      .channel('deliveries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
        },
        () => {
          console.log('Realtime update received for deliveries!');
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchDeliveries]);

  const addDelivery = useCallback(async (d: Omit<Delivery, 'id'>) => {
    const { data, error } = await supabase.from('deliveries').insert({
      customer_id: d.customerId,
      customer_name: d.customerName,
      driver_id: d.driverId || null,
      driver_name: d.driverName,
      pickup_location: d.pickup,
      dropoff_location: d.dropoff,
      status: d.status,
      fee: d.fee,
      payment_method: d.paymentMethod,
      estimated_time: d.estimatedTime,
      sender_name: d.senderName,
      sender_phone: d.senderPhone,
      recipient_name: d.recipientName,
      recipient_phone: d.recipientPhone,
      item_size: d.itemSize,
      item_weight: d.itemWeight,
      item_type: d.itemType,
      vehicle_type: d.vehicleType,
    }).select('id').single();

    if (error) {
      console.error('addDelivery DB error:', error.message, '| code:', error.code, '| details:', error.details, '| hint:', error.hint);
      throw new Error(`DB Error: ${error.message}`);
    }

    // Mark driver as unavailable immediately (Business Rule: one active delivery)
    if (d.driverId) {
      try {
        const { error: updateErr } = await supabase.from('drivers').update({ is_available: false }).eq('id', d.driverId);
        if (updateErr) console.warn('Non-critical: Failed to update driver availability:', updateErr.message);
      } catch (e) {
        console.warn('Non-critical: Driver availability update exception:', e);
      }
    }

    fetchDeliveries();
    return data.id as string;
  }, [fetchDeliveries]);

  const updateDelivery = useCallback(async (deliveryId: string, updates: Partial<Delivery>) => {
    const supabaseUpdates: any = {};
    if (updates.status) supabaseUpdates.status = updates.status;
    if (updates.paymentMethod) supabaseUpdates.payment_method = updates.paymentMethod;
    if (updates.senderName) supabaseUpdates.sender_name = updates.senderName;
    if (updates.senderPhone) supabaseUpdates.sender_phone = updates.senderPhone;
    if (updates.recipientName) supabaseUpdates.recipient_name = updates.recipientName;
    if (updates.recipientPhone) supabaseUpdates.recipient_phone = updates.recipientPhone;
    if (updates.itemSize) supabaseUpdates.item_size = updates.itemSize;
    if (updates.itemWeight) supabaseUpdates.item_weight = updates.itemWeight;
    if (updates.itemType) supabaseUpdates.item_type = updates.itemType;
    if (updates.vehicleType) supabaseUpdates.vehicle_type = updates.vehicleType;

    const { error } = await supabase
      .from('deliveries')
      .update(supabaseUpdates)
      .eq('id', deliveryId);

    if (error) {
      console.error('Error updating delivery:', error.message, '| code:', error.code);
      throw new Error(`Update failed: ${error.message}`);
    }

    await fetchDeliveries();
  }, [fetchDeliveries]);

  const updateDeliveryStatus = useCallback(async (deliveryId: string, status: DeliveryStatus) => {
    const { data: currentDel } = await supabase.from('deliveries').select('*').eq('id', deliveryId).single();
    
    const { error } = await supabase
      .from('deliveries')
      .update({ status })
      .eq('id', deliveryId);

    if (error) {
      console.error('Error updating status:', error.message, error.code);
      throw new Error(`Failed to update status: ${error.message}`);
    }

    // Handle completed or cancelled delivery (Business Rules)
    if ((status === 'delivered' || status === 'cancelled') && currentDel) {
      // 1. Mark driver as available again
      if (currentDel.driver_id) {
        await supabase.from('drivers').update({ is_available: true }).eq('id', currentDel.driver_id);
      }
      
      // 2. Record formal payment only for 'delivered' status
      if (status === 'delivered') {
        try {
          await supabase.from('payments').insert({
            delivery_id: deliveryId,
            amount: currentDel.fee,
            payment_method: currentDel.payment_method,
            payment_status: 'completed'
          });
        } catch (paymentErr) {
          console.warn('Payment record insert failed (table may not exist yet):', paymentErr);
        }
      }
    }

    fetchDeliveries();
  }, [fetchDeliveries]);

  const findAvailableDriver = useCallback(async () => {
    // Use maybeSingle() so it returns null (not an error) when no rows found
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*, profiles(name, avatar_url, phone)')
        .eq('is_available', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('findAvailableDriver DB error:', error.message, error.code);
        return null;
      }

      if (!data) {
        console.warn('No available drivers found in database.');
        return null;
      }

      const profiles = data.profiles as any;

      return {
        id: data.id,
        name: profiles?.name || 'Driver',
        avatar: profiles?.name ? profiles.name.slice(0, 2).toUpperCase() : 'DR',
        vehicle: data.vehicle_type,
        plateNumber: data.plate_number,
        rating: data.rating,
        totalDeliveries: 0,
        isAvailable: data.is_available,
        phone: profiles?.phone || '',
      };
    } catch (err) {
      console.error('findAvailableDriver unexpected error:', err);
      return null;
    }
  }, []);

  // ── Booking (local state, same as before) ──
  const setBooking = useCallback((partial: Partial<BookingState>) => {
    setBookingState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetBooking = useCallback(() => {
    setBookingState(defaultBooking);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        deliveries,
        booking,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        fetchDeliveries,
        addDelivery,
        updateDelivery,
        updateDeliveryStatus,
        findAvailableDriver,
        setBooking,
        resetBooking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
