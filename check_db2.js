const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://ujxazottedzdrqqsukxw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeGF6b3R0ZWR6ZHJxcXN1a3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MjIzNjIsImV4cCI6MjA5Mjk5ODM2Mn0.TRi79dmc9eKymwhJDjz3yf0XNfCmkl9gZSv2crgu2jU');

async function test() {
  try {
    const email = 'test_customer_' + Date.now() + '@example.com';
    const password = 'password123';
    
    console.log('Signing up...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: 'Test Customer', role: 'customer' } }
    });
    
    if (authError) {
       console.log('Auth Error:', authError);
       return;
    }
    
    console.log('Testing driver search...');
    let start = Date.now();
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();
    console.log('Driver:', driver?.id, 'Time:', Date.now() - start);

    if (!driver) {
       console.log('No drivers available');
       return;
    }

    start = Date.now();
    console.log('Testing delivery insert...');
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        customer_id: authData.user.id,
        customer_name: 'Test Customer',
        driver_id: driver.id,
        driver_name: 'Driver',
        pickup_location: 'A',
        dropoff_location: 'B',
        delivery_status: 'pending',
        delivery_fee: 100,
        payment_method: 'cash',
        item_size: 'S',
        item_weight: 1,
        item_type: 'Documents',
        vehicle_type: 'Motorcycle',
        sender_name: 'Sender',
        sender_phone: '123',
        recipient_name: 'Recipient',
        recipient_phone: '123'
      })
      .select()
      .single();
    console.log('Delivery:', delivery?.id, deliveryError, 'Time:', Date.now() - start);

  } catch (err) {
    console.error(err);
  }
}
test();
