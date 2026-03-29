const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('orders').select('created_at, total_amount, status').order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  console.log("Total orders:", data.length);
  
  let todayTotal = 0;
  let allTotal = 0;
  const now = new Date();
  
  // Quick local start of day
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  data.forEach(o => {
    const d = new Date(o.created_at);
    if (o.status !== 'cancelled' && o.status !== 'Cancelled') {
      allTotal += o.total_amount;
      if (d >= startOfToday) {
        todayTotal += o.total_amount;
      }
    }
    console.log(`${o.created_at} | amt: ${o.total_amount} | status: ${o.status}`);
  });
  
  console.log("Calculated Today:", todayTotal);
  console.log("Calculated All:", allTotal);
}
check();
