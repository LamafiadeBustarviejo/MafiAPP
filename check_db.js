import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf-8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val) envVars[key.trim()] = val.join('=').trim()
})

const supabaseUrl = envVars['VITE_SUPABASE_URL']
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDb() {
  console.log('--- VERIFICANDO BASE DE DATOS ---')
  
  const { data: users, error: err1 } = await supabase.from('profiles').select('*')
  console.log('Perfiles:', users?.length || 0, err1?.message || 'OK')

  const { data: members, error: err2 } = await supabase.from('members').select('*')
  console.log('Miembros:', members?.length || 0, err2?.message || 'OK')
  
  if (members && members.length > 0) {
    console.log(members[0])
  }
}

checkDb()
