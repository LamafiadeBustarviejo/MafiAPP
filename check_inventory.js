import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data: inv } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false }).limit(2)
  console.log("Latest inventory:", inv)
}
check()
