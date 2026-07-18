import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY'

// We need to read from .env
import fs from 'fs'
import dotenv from 'dotenv'
const envConfig = dotenv.parse(fs.readFileSync('.env'))
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      name: 'Test Empty String Category',
      category_id: "",
      owner_id: "",
      quantity: 1,
      status: 'available',
      location: '',
      description: ''
    })
    
  console.log('Error:', error)
  console.log('Data:', data)
}

test()
