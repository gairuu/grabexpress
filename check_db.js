const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://ujxazottedzdrqqsukxw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeGF6b3R0ZWR6ZHJxcXN1a3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MjIzNjIsImV4cCI6MjA5Mjk5ODM2Mn0.TRi79dmc9eKymwhJDjz3yf0XNfCmkl9gZSv2crgu2jU');

async function test() {
  try {
    console.log('Testing driver search...');
    let start = Date.now();
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();
    console.log('Driver:', driver?.id, 'Time:', Date.now() - start);

    if (!driver) return;

    start = Date.now();
    console.log('Testing profile fetch...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, contact_number')
      .eq('id', driver.id)
      .maybeSingle();
    console.log('Profile:', profile, profileError, 'Time:', Date.now() - start);

    start = Date.now();
    console.log('Testing delivery insert...');
    // test insert with dummy data
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        customer_id: 'bf212a06-b89c-4456-a702-55ce045fa099', // using driver id as customer id just for test
        customer_name: 'Test Customer',
        driver_id: driver.id,
        driver_name: profile?.name || 'Driver',
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

    if (delivery) {
       start = Date.now();
       console.log('Testing driver update...');
       const {error: upErr} = await supabase.from('drivers').update({ status: 'busy' }).eq('id', driver.id);
       console.log('Update Error:', upErr, 'Time:', Date.now() - start);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
