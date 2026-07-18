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
  const chankete = members.find(m => m.nickname.toLowerCase().includes('chankete') || m.nickname.toLowerCase().includes('char'))
  console.log("Chankete ID:", chankete?.id)
  
  if (chankete) {
    const { data: movs } = await supabase.from('financial_movements').select('*').eq('concept', 'hielos').order('created_at', { ascending: false }).limit(1)
    if (movs && movs.length > 0) {
      const mov = movs[0]
      if (mov.member_id === null) {
        await supabase.from('financial_movements').update({ member_id: chankete.id }).eq('id', mov.id)
        console.log("Updated movement", mov.id, "to member", chankete.id)
      }
    }
  }
}

run().catch(console.error)
