import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
)

async function run() {
  const { data, error } = await supabase.from('financial_movements').select('*').order('created_at', { ascending: false }).limit(10)
  console.log("Movements:", JSON.stringify(data, null, 2))
}

run().catch(console.error)
