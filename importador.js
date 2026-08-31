import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Falta VITE_SUPABASE_URL o VITE_SUPABASE_SERVICE_ROLE_KEY en el .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const membersToImport = [
  { nombre: "Aitor Martinez Garcia", telefono: "646539495", email: "kotufa10@hotmail.com", rol: "member", apodo: "Kotufa" },
  { nombre: "Álvaro Pascual Plaza", telefono: "616324026", email: "soco@mafiapp.local", rol: "member", apodo: "Soco" },
  { nombre: "Andrea", telefono: "659411144", email: "andrea@mafiapp.local", rol: "member", apodo: "Andrea" },
  { nombre: "beni carlo", telefono: "617805054", email: "beni@mafiapp.local", rol: "member", apodo: "Beni" },
  { nombre: "Borja", telefono: "660378730", email: "borja@mafiapp.local", rol: "member", apodo: "Borji" },
  { nombre: "Brian", telefono: "606897468", email: "brian@mafiapp.local", rol: "member", apodo: "Brian" },
  { nombre: "Juan Manuel", telefono: "680235702", email: "Bubillotron_87@hotmail.com", rol: "admin", apodo: "Bubillo" },
  { nombre: "Charly Charlessons", telefono: "688264356", email: "soyelcharly@gmail.com", rol: "admin", apodo: "Chankete" },
  { nombre: "Alvaro Soriano", telefono: "646867941", email: "cherrykittles@hotmail.com", rol: "admin", apodo: "Cherry" },
  { nombre: "Chus", telefono: "618105988", email: "chus@mafiapp.local", rol: "member", apodo: "Chus" },
  { nombre: "Dani Jara", telefono: "628630661", email: "jabali@mafiapp.local", rol: "member", apodo: "Jabalí" },
  { nombre: "David García García", telefono: "686281242", email: "sederap86@hotmail.com", rol: "admin", apodo: "Paredes" },
  { nombre: "Diego Baonza del Moral", telefono: "626465856", email: "diegolbdm11@gmail.com", rol: "admin", apodo: "Diego" },
  { nombre: "Miguel Aranguren", telefono: "638043836", email: "info@jardineriamaragil.com", rol: "admin", apodo: "Miki" },
  { nombre: "Estefanía", telefono: "691260175", email: "estefania@mafiapp.local", rol: "member", apodo: "Estefanía" },
  { nombre: "Hugo Sanchez", telefono: "660249129", email: "hugo@mafiapp.local", rol: "member", apodo: "Huguero" },
  { nombre: "Ismael mecánico", telefono: "618369776", email: "mecanitron_88@hotmail.com", rol: "admin", apodo: "Meca" },
  { nombre: "Javi mafias", telefono: "669351727", email: "javipuskas@mafiapp.local", rol: "member", apodo: "Javi puskas" },
  { nombre: "Javier Celada Rodriguez", telefono: "626289756", email: "javiculo@mafiapp.local", rol: "member", apodo: "Javi culo" },
  { nombre: "Daniel Jimeno", telefono: "626921284", email: "djimenolagrutta@gmail.com", rol: "admin", apodo: "Jime" },
  { nombre: "jorge romero", telefono: "620655195", email: "jorge@mafiapp.local", rol: "member", apodo: "RICHELIER" },
  { nombre: "Alberto Ballesteros", telefono: "660937920", email: "kabezas@mafiapp.local", rol: "member", apodo: "Kabezas" },
  { nombre: "Ruben Cebrián", telefono: "647055822", email: "ruben@mafiapp.local", rol: "admin", apodo: "Karateja" },
  { nombre: "Carlos Collado", telefono: "628824948", email: "Colladochef@gmail.com", rol: "admin", apodo: "Carlón" },
  { nombre: "Manu Rasca", telefono: "680582717", email: "manu@mafiapp.local", rol: "member", apodo: "Manu" },
  { nombre: "Miguel Angel Ballesteros", telefono: "676203844", email: "poty@mafiapp.local", rol: "admin", apodo: "Poty" },
  { nombre: "Oscar dj", telefono: "665280503", email: "oscardj@mafiapp.local", rol: "member", apodo: "Muñekas" },
  { nombre: "Oscar Peluso", telefono: "606528070", email: "oscarpeluso@mafiapp.local", rol: "member", apodo: "Peluso" },
  { nombre: "Pablo Del Valle", telefono: "680176594", email: "paul_ofthevalley@hotmail.com", rol: "admin", apodo: "Terrores" },
  { nombre: "Pablo Romero Plaza", telefono: "659333315", email: "barrullitas@hotmail.com", rol: "admin", apodo: "Barrullas" },
  { nombre: "Paul Miraflores", telefono: "659320778", email: "polete@mafiapp.local", rol: "member", apodo: "Polete" },
  { nombre: "Ruben Martin Gallego", telefono: "620593764", email: "R19martin@gmail.com", rol: "member", apodo: "Rubencio" },
  { nombre: "Tiberio", telefono: "677421242", email: "tiberio@mafiapp.local", rol: "member", apodo: "Tiberio" },
  { nombre: "Víctor", telefono: "649385531", email: "trezeh@mafiapp.local", rol: "member", apodo: "Trezeh" },
  { nombre: "Alberto", telefono: "649012195", email: "wini@mafiapp.local", rol: "member", apodo: "Wini" },
  { nombre: "\\0110\\", telefono: "692152162", email: "0110@mafiapp.local", rol: "member", apodo: "0110" },
  { nombre: "HECTOR", telefono: "608822457", email: "hector@mafiapp.local", rol: "member", apodo: "Hector" },
  { nombre: "Charlie otro", telefono: "680235901", email: "charlieotro@mafiapp.local", rol: "member", apodo: "Charlie otro" },
  { nombre: "Cristian", telefono: "630073396", email: "cristian@mafiapp.local", rol: "member", apodo: "Cristian" },
  { nombre: "David Jiménez Berrocosa", telefono: "686997173", email: "kaka@mafiapp.local", rol: "member", apodo: "Kaka" },
  { nombre: "Javi", telefono: "651315262", email: "javi@mafiapp.local", rol: "member", apodo: "Javi" },
  { nombre: "Desconocido", telefono: "650662778", email: "desconocido@mafiapp.local", rol: "member", apodo: "Desconocido" }
];

async function run() {
  console.log("Iniciando importación masiva final de 42 usuarios...");
  
  // 1. Obtener roles
  const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
  if (rolesError) throw rolesError;
  const roleMap = {
    'admin': roles.find(r => r.name === 'admin').id,
    'member': roles.find(r => r.name === 'member').id
  };

  // 2. Obtener la lista de usuarios actuales para no intentar crear los que ya existen (ej. Charly o Cherry)
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
      console.error("Error al listar usuarios actuales:", listError.message);
  }
  const existingEmailsMap = {};
  if (existingUsers && existingUsers.users) {
      for (const u of existingUsers.users) {
          existingEmailsMap[u.email.toLowerCase()] = u.id;
      }
  }

  // 3. Crear o actualizar usuarios
  for (const m of membersToImport) {
    console.log(`\nProcesando usuario: ${m.nombre} (${m.email})`);
    
    let userId = existingEmailsMap[m.email.toLowerCase()];

    if (!userId) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: m.email,
        password: 'mafiapp2026',
        email_confirm: true,
        user_metadata: { name: m.nombre }
        });

        if (createError) {
            console.error(`  Error creando a ${m.email}:`, createError.message);
            continue;
        }
        userId = newUser.user.id;
        console.log(`  Usuario creado en Auth con ID: ${userId}`);
    } else {
        console.log(`  El usuario ya existe en Auth, actualizando su perfil...`);
    }
    
    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Comprobar si el trigger de Supabase ha fallado en crear el profile
    const { data: profileExists } = await supabase.from('profiles').select('id').eq('id', userId).single();
    if (!profileExists) {
        await supabase.from('profiles').insert({ id: userId, email: m.email, phone: m.telefono });
    } else {
        await supabase.from('profiles').update({ phone: m.telefono }).eq('id', userId);
    }

    const { data: memberExists } = await supabase.from('members').select('id').eq('profile_id', userId).single();
    let memberId;
    if (!memberExists) {
        const { data: newMember } = await supabase.from('members').insert({
            profile_id: userId,
            nickname: m.apodo,
            role_id: roleMap[m.rol]
        }).select('id').single();
        memberId = newMember.id;
    } else {
        await supabase.from('members').update({ 
            nickname: m.apodo,
            role_id: roleMap[m.rol]
        }).eq('profile_id', userId);
        memberId = memberExists.id;
    }

    console.log(`  ✅ Usuario ${m.apodo || m.nombre} configurado perfectamente.`);
  }

  console.log("\n🎉 ¡IMPORTACIÓN COMPLETADA CON ÉXITO!");
}

run().catch(console.error);
