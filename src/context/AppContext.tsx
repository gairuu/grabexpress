'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppUser, BookingState, Delivery, DeliveryStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface AppContextType {
  user: AppUser | null;
  loading: boolean;
  deliveries: Delivery[];
  booking: BookingState;
  signUp: (email: string, password: string, name: string, role: AppUser['role'], driverDetails?: { licenseNumber: string, plateNumber: string, vehicleType: string }) => Promise<{ error: string | null }>;
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
  clearDeliveries: () => Promise<void>;
  confirmPayment: (deliveryId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<AppUser>) => Promise<void>;
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
          let profile = await fetchProfile(session.user.id);
          
          // If no profile exists (e.g. first time Google sign-in)
          if (!profile) {
            console.log('No profile found for user, creating default...');
            const { data: newUser } = await supabase.auth.getUser();
            if (newUser.user) {
              const name = newUser.user.user_metadata.full_name || newUser.user.email?.split('@')[0] || 'User';
              const email = newUser.user.email || '';
              
              // Check if a role was saved in localStorage during signup
              const savedRole = localStorage.getItem('grab_signup_role') as AppUser['role'] || 'customer';
              
              // Create the profile
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: newUser.user.id,
                  name,
                  email,
                  role: savedRole
                });
                
              if (!insertError) {
                // If it's a driver, create the driver record too
                if (savedRole === 'driver') {
                  await supabase.from('drivers').insert({
                    id: newUser.user.id,
                    vehicle_type: 'Motorcycle',
                    plate_number: 'TBD',
                    rating: 5.0,
                    status: 'available'
                  });
                }
                profile = await fetchProfile(newUser.user.id);
                localStorage.removeItem('grab_signup_role'); // Clean up
              }
            }
          }
          
          setUser(profile);
        }
      } catch (err) {
        console.error("Auth initialization profile fetch failed:", err);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
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
              // Check if there's a pending role from a Google Signup
              const pendingRole = localStorage.getItem('grab_signup_role');
              if (pendingRole && session.user) {
                console.log('Finalizing role setup for:', pendingRole);
                
                // 1. Update the profile role
                await supabase.from('profiles').update({ role: pendingRole }).eq('id', session.user.id);
                
                // 2. If they are a driver, ensure driver and vehicle records exist
                if (pendingRole === 'driver') {
                  await supabase.from('drivers').upsert({ id: session.user.id, status: 'available', rating: 5.0 }).select();
                  await supabase.from('vehicles').upsert({ 
                    driver_id: session.user.id, 
                    plate_number: 'PENDING', 
                    vehicle_type: 'Motorcycle' 
                  }).select();
                }
                
                localStorage.removeItem('grab_signup_role');
              }
              
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
  const signUp = useCallback(async (email: string, password: string, name: string, role: AppUser['role'], driverDetails?: { licenseNumber: string, plateNumber: string, vehicleType: string }) => {
    try {
      console.log('Starting signUp process for:', email, role);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // These metadata fields are picked up by the database trigger 'handle_new_user'
          data: { 
            name, 
            role,
            licenseNumber: driverDetails?.licenseNumber,
            plateNumber: driverDetails?.plateNumber,
            vehicleType: driverDetails?.vehicleType
          },
        },
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'Signup failed. Please try again.' };

      // The database trigger 'handle_new_user' now automatically creates:
      // 1. The profile record with the correct role.
      // 2. The drivers record (if role is driver).
      // 3. The vehicles record (if role is driver).
      
      console.log('Signup successful, trigger handling records...');

      return { error: null };
    } catch (err: any) {
      console.error('Unexpected signUp error:', err);
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('Starting signIn process for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('SignIn error:', error.message);
      return { error: error.message };
    }
    // Immediately fetch and set the user profile so the redirect useEffect fires
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        setUser(profile);
      }
    }
    console.log('SignIn successful');
    return { error: null };
  }, [fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
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
        payment_status: row.payment_status || 'unpaid',
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

    // 3. Handle business rules (driver availability)
    if ((status === 'delivered' || status === 'cancelled') && currentDel) {
      // Free up the driver
      const drId = currentDel.driver_id;
      if (drId) {
        console.log('Freeing up driver:', drId);
        await supabase.from('drivers').update({ status: 'available' }).eq('id', drId);
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
            booking_time: new Date().toISOString(),
            payment_status: 'unpaid',
            broadcast_status: 'matched'
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

  const clearDeliveries = useCallback(async () => {
    if (!user || user.role !== 'customer') return;

    // Delete all deliveries for this customer to make it look clean
    const { error } = await supabase
      .from('deliveries')
      .delete()
      .eq('customer_id', user.id);

    if (error) {
      console.error('Error clearing deliveries:', error.message);
      throw new Error(`Clear failed: ${error.message}`);
    }

    await fetchDeliveries();
  }, [user, fetchDeliveries]);

  const resetBooking = useCallback(() => {
    setBookingState(defaultBooking);
  }, []);

  const confirmPayment = useCallback(async (deliveryId: string) => {
    const { error } = await supabase
      .from('deliveries')
      .update({ payment_status: 'paid' })
      .eq('id', deliveryId);

    if (error) throw new Error(`Payment confirmation failed: ${error.message}`);
    await fetchDeliveries();
  }, [fetchDeliveries]);

  const deleteUser = useCallback(async (userId: string) => {
    if (user?.role !== 'admin') return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw new Error(`Delete failed: ${error.message}`);
    // No need to fetch profile, but might need to fetch users list if we had one
  }, [user]);

  const updateUserProfile = useCallback(async (userId: string, updates: Partial<AppUser>) => {
    if (user?.role !== 'admin' && user?.id !== userId) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(`Update failed: ${error.message}`);
    if (user?.id === userId) {
      const profile = await fetchProfile(userId);
      setUser(profile);
    }
  }, [user, fetchProfile]);

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
        clearDeliveries,
        confirmPayment,
        deleteUser,
        updateUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
