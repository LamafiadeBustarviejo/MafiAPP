import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

// Para consultar auth.users necesitas el service_role key, pero como no lo tenemos en .env por defecto, 
// intentaremos iniciar sesión con las credenciales que dice el usuario.

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLogin() {
  console.log("Intentando login con soyelcharly@gmail.com / mafiapp2026...")
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'soyelcharly@gmail.com',
    password: 'mafiapp2026'
  })
  
  if (error) {
    console.error("Error Login:", error.message)
    // Intentemos ver si el usuario existe en nuestra tabla profiles
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'soyelcharly@gmail.com').single()
    console.log("Profile encontrado en BD pública:", profile)
  } else {
    console.log("Login exitoso. User ID:", data.user.id)
  }
}

checkLogin()
