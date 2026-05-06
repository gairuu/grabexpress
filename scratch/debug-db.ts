
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ujxazottedzdrqqsukxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeGF6b3R0ZWR6ZHJxcXN1a3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MjIzNjIsImV4cCI6MjA5Mjk5ODM2Mn0.TRi79dmc9eKymwhJDjz3yf0XNfCmkl9gZSv2crgu2jU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
  console.log("--- DRIVERS ---")
  const { data: drivers } = await supabase.from('drivers').select('*, profiles(name)')
  console.table(drivers?.map(d => ({ id: d.id, name: d.profiles.name, status: d.status })))

  console.log("\n--- RECENT DELIVERIES ---")
  const { data: deliveries } = await supabase.from('deliveries').select('*').order('booking_time', { ascending: false }).limit(5)
  console.table(deliveries?.map(d => ({ id: d.id.slice(0,8), driver_id: d.driver_id, driver_name: d.driver_name, status: d.delivery_status })))
}

debug()
