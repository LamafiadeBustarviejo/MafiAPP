import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
)

async function run() {
  const { data: members } = await supabase.from('members').select('*')
  const chankete = members.find(m => m.nickname.toLowerCase().includes('chankete'))
  console.log("Chankete ID:", chankete?.id)
  
  if (chankete) {
    const { data: movs } = await supabase.from('financial_movements').select('*').eq('concept', 'hielos').order('created_at', { ascending: false }).limit(2)
    console.log("Hielos movements:", JSON.stringify(movs, null, 2))
  }
}

run().catch(console.error)
