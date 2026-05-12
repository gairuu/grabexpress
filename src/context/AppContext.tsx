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
  bookAndMatch: (d: Omit<Delivery, 'id'>) => Promise<string>;
  findAvailableDriver: () => Promise<any>;
  setBooking: (b: Partial<BookingState>) => void;
  resetBooking: () => void;
}

const defaultBooking: BookingState = {
  id: '',
  pickup_location: '',
  dropoff_location: '',
  delivery_fee: 0,
  driver: null,
  delivery_status: 'pending',
  payment_method: 'cash',
  sender_name: '',
  sender_phone: '',
  recipient_name: '',
  recipient_phone: '',
  item_size: 'S',
  item_weight: 1,
  item_type: 'Documents',
  vehicle_type: 'Motorcycle',
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
      contact_number: data.contact_number,
      role: data.role,
    };

    if (data.role === 'driver') {
      appUser.linkedDriverId = data.id;
    }

    return appUser;
  }, []);

  // ── Listen to auth state changes ──
  useEffect(() => {
    // Safety net: force loading to false after 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Resilience Safety Net: Initial loading timed out after 5s.');
        setLoading(false);
      }
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        }
      } catch (err) {
        console.error("Auth initialization profile fetch failed:", err);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    }).catch(err => {
      console.error("Critical auth session fetch error:", err);
      setLoading(false);
      clearTimeout(safetyTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Use setTimeout to yield the event loop. This is CRITICAL to prevent a known 
        // Supabase JS deadlock where calling supabase API methods inside onAuthStateChange 
        // blocks the internal navigator.locks, causing all subsequent queries to hang indefinitely.
        setTimeout(async () => {
          try {
            if (event === 'SIGNED_IN' && session?.user) {
              const profile = await fetchProfile(session.user.id);
              setUser(profile);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setDeliveries([]);
            }
          } catch (err) {
            console.error("Auth change handling failed:", err);
          } finally {
            setLoading(false);
          }
        }, 0);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
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
          status: 'available',
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

    let query = supabase.from('deliveries').select('*').order('booking_time', { ascending: false });

    // Admin sees all, customer sees their own, driver sees assigned + unassigned pending
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
        customer_id: row.customer_id,
        customer_name: row.customer_name || 'Unknown',
        driver_id: row.driver_id || '',
        driver_name: row.driver_name || 'Unassigned',
        pickup_location: row.pickup_location,
        dropoff_location: row.dropoff_location,
        delivery_status: row.delivery_status,
        delivery_fee: Number(row.delivery_fee),
        payment_method: row.payment_method,
        booking_time: row.booking_time,
        estimated_time: row.estimated_time || '',
        sender_name: row.sender_name,
        sender_phone: row.sender_phone,
        recipient_name: row.recipient_name,
        recipient_phone: row.recipient_phone,
        item_size: row.item_size,
        item_weight: row.item_weight,
        item_type: row.item_type,
        vehicle_type: row.vehicle_type,
      }));
      setDeliveries(mapped);
    }
  }, [user]);

  // ── Set up Realtime listener ──
  useEffect(() => {
    if (!user) return;

    fetchDeliveries();

    // Set up Realtime subscription for "instant" updates
    const deliveryChannel = supabase
      .channel('deliveries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
        },
        (payload: any) => {
          // Only trigger fetch if it's relevant to the current user
          const newDel = payload.new;
          const oldDel = payload.old;
          
          const isRelevant = 
            user.role === 'admin' || 
            (newDel && (newDel.customer_id === user.id || newDel.driver_id === user.id)) ||
            (oldDel && (oldDel.customer_id === user.id || oldDel.driver_id === user.id));

          if (isRelevant) {
            fetchDeliveries();
          }
        }
      )
      .subscribe();

    // Listen for driver availability changes
    const driverChannel = supabase
      .channel('drivers-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
        },
        (payload: any) => {
          if (payload.new.id === user.id || user.role === 'customer') {
            fetchDeliveries();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deliveryChannel);
      supabase.removeChannel(driverChannel);
    };
  }, [user?.id, fetchDeliveries]);

  const addDelivery = useCallback(async (d: Omit<Delivery, 'id'>) => {
    const { data, error } = await supabase.from('deliveries').insert({
      customer_id: d.customer_id,
      customer_name: d.customer_name,
      driver_id: d.driver_id || null,
      driver_name: d.driver_name,
      pickup_location: d.pickup_location,
      dropoff_location: d.dropoff_location,
      delivery_status: d.delivery_status,
      delivery_fee: d.delivery_fee,
      payment_method: d.payment_method,
      estimated_time: d.estimated_time,
      sender_name: d.sender_name,
      sender_phone: d.sender_phone,
      recipient_name: d.recipient_name,
      recipient_phone: d.recipient_phone,
      item_size: d.item_size,
      item_weight: d.item_weight,
      item_type: d.item_type,
      vehicle_type: d.vehicle_type,
    }).select('id').single();

    if (error) {
      console.error('addDelivery DB error:', error.message, '| code:', error.code, '| details:', error.details, '| hint:', error.hint);
      throw new Error(`DB Error: ${error.message}`);
    }

    // If a driver is already assigned (old flow), mark them busy
    if (d.driver_id) {
      try {
        await supabase.from('drivers').update({ status: 'busy' }).eq('id', d.driver_id);
      } catch (e) {
        console.warn('Driver status update failed:', e);
      }
    }

    fetchDeliveries();
    return data.id as string;
  }, [fetchDeliveries]);

  const updateDelivery = useCallback(async (deliveryId: string, updates: Partial<Delivery>) => {
    const supabaseUpdates: any = {};
    if (updates.delivery_status) supabaseUpdates.delivery_status = updates.delivery_status;
    if (updates.payment_method) supabaseUpdates.payment_method = updates.payment_method;
    if (updates.sender_name) supabaseUpdates.sender_name = updates.sender_name;
    if (updates.sender_phone) supabaseUpdates.sender_phone = updates.sender_phone;
    if (updates.recipient_name) supabaseUpdates.recipient_name = updates.recipient_name;
    if (updates.recipient_phone) supabaseUpdates.recipient_phone = updates.recipient_phone;
    if (updates.item_size) supabaseUpdates.item_size = updates.item_size;
    if (updates.item_weight) supabaseUpdates.item_weight = updates.item_weight;
    if (updates.item_type) supabaseUpdates.item_type = updates.item_type;
    if (updates.vehicle_type) supabaseUpdates.vehicle_type = updates.vehicle_type;

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
    // 1. Fetch current delivery state
    const { data: currentDel, error: fetchError } = await supabase.from('deliveries').select('*').eq('id', deliveryId).maybeSingle();

    if (fetchError) {
      console.error('Error fetching current delivery:', fetchError.message);
      throw new Error(`Failed to fetch delivery details: ${fetchError.message}`);
    }

    if (!currentDel) {
      throw new Error('Delivery not found in database.');
    }
    
    // 2. Perform the update
    const { error: updateError } = await supabase
      .from('deliveries')
      .update({ delivery_status: status })
      .eq('id', deliveryId);

    if (updateError) {
      console.error('Error updating status:', updateError.message, updateError.code);
      throw new Error(`Failed to update status: ${updateError.message}`);
    }

    // 3. Handle business rules (driver availability, payments)
    if ((status === 'delivered' || status === 'cancelled') && currentDel) {
      // Free up the driver
      const drId = currentDel.driver_id;
      if (drId) {
        console.log('Freeing up driver:', drId);
        await supabase.from('drivers').update({ status: 'available' }).eq('id', drId);
      }
      
      if (status === 'delivered') {
        try {
          await supabase.from('payments').insert({
            delivery_id: deliveryId,
            amount: currentDel.delivery_fee,
            payment_method: currentDel.payment_method,
            payment_status: 'completed'
          });
        } catch (paymentErr) {
          console.warn('Payment record insert failed:', paymentErr);
        }
      }
    }

    await fetchDeliveries();
  }, [fetchDeliveries]);

  const bookAndMatch = useCallback(async (deliveryData: Omit<Delivery, 'id'>) => {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Matching timed out. Please try again.')), 15000);
    });

    const bookingFlow = (async () => {
      try {
        console.log('[bookAndMatch] Step 1: Finding available driver...');
        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('status', 'available')
          .limit(1)
          .maybeSingle();

        if (driverError) throw new Error(`Driver search failed: ${driverError.message}`);
        if (!driver) throw new Error("No available drivers found. Please try again in a moment.");

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, contact_number')
          .eq('id', driver.id)
          .maybeSingle();

        const { data: delivery, error: deliveryError } = await supabase
          .from('deliveries')
          .insert({
            customer_id: deliveryData.customer_id,
            customer_name: deliveryData.customer_name,
            driver_id: driver.id,
            driver_name: profile?.name || 'Driver',
            pickup_location: deliveryData.pickup_location,
            dropoff_location: deliveryData.dropoff_location,
            delivery_status: 'pending',
            delivery_fee: deliveryData.delivery_fee,
            payment_method: deliveryData.payment_method,
            item_size: deliveryData.item_size,
            item_weight: deliveryData.item_weight,
            item_type: deliveryData.item_type,
            vehicle_type: deliveryData.vehicle_type,
            sender_name: deliveryData.sender_name,
            sender_phone: deliveryData.sender_phone,
            recipient_name: deliveryData.recipient_name,
            recipient_phone: deliveryData.recipient_phone,
            booking_time: new Date().toISOString()
          })
          .select('id')
          .single();

        if (deliveryError) throw new Error(`Booking failed: ${deliveryError.message}`);

        await supabase.from('drivers').update({ status: 'busy' }).eq('id', driver.id);

        fetchDeliveries();
        return delivery.id;
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return await Promise.race([bookingFlow, timeoutPromise]) as string;
  }, [fetchDeliveries]);

  const findAvailableDriver = useCallback(async () => {
    // Safety timeout for the search
    const fetchPromise = supabase
      .from('drivers')
      .select('*, profiles(name, avatar_url, contact_number)')
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Driver search timed out')), 10000)
    );

    try {
      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const data = result.data;
      const error = result.error;

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
        plate_number: data.plate_number,
        rating: data.rating,
        totalDeliveries: 0,
        status: data.status,
        contact_number: profiles?.contact_number || '',
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
        bookAndMatch,
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
