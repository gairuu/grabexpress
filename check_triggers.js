const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://ujxazottedzdrqqsukxw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeGF6b3R0ZWR6ZHJxcXN1a3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MjIzNjIsImV4cCI6MjA5Mjk5ODM2Mn0.TRi79dmc9eKymwhJDjz3yf0XNfCmkl9gZSv2crgu2jU');

async function test() {
  const { data, error } = await supabase.rpc('get_triggers_dummy') || await supabase.from('pg_trigger').select('*');
  console.log(error);
}
test();
