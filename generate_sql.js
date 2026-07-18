import fs from 'fs';

const rawData = `Nombre	telefono	Email	Rol	Apodo
Aitor Martinez Garcia	646539495		Miembro	Kotufa
Álvaro Pascual Plaza	616324026		Miembro	Soco
Andrea	659411144		Miembro	
beni carlo	617805054		Miembro	Beni
Borja	660378730		Miembro	Borji
Brian	606897468		Miembro	
Juan Manuel	680235702		Administrador	Bubillo
Charly Charlessons	688264356	soyelcharly@gmail.com	Administrador	Chankete
Alvaro Soriano	646867941		Administrador	Cherry 
Chus 	618105988		Miembro	
Dani Jara	628630661		Miembro	Jabalí
David García García	686281242		Administrador	Paredes
Diego Baonza del Moral	626465856		Administrador	
Miguel Aranguren	638043836		Administrador	Miki
Estefanía	691260175		Miembro	
Hugo Sanchez	660249129		Miembro	Huguero
Ismael mecánico	618369776		Administrador	Meca
Javi mafias Francisco Javier Ballestero	669351727		Miembro	
Javier Celada Rodriguez	626289756		Miembro	
Daniel Jimeno	626921284		Administrador	Jime
jorge romero, 	620655195		Miembro	RICHELIER
Alberto Ballesteros	660937920		Miembro	Kabezas
Ruben Cebrián	647055822		Administrador	Karateja
Carlos Collado	628824948		Administrador	Carlón
Manu Rasca	680582717		Miembro	
Miguel Angel Ballesteros	676203844		Administrador	Poty
Oscar dj	665280503		Miembro	Muñekas
Oscar Peluso	606528070		Miembro	Peluso
Pablo Del Valle	680176594		Administrador	Terrores
Pablo Romero Plaza	659333315		Administrador	Barrullas
Paul Miraflores	659320778		Miembro	Polete
Ruben Martin Gallego	620593764		Miembro	Rubencio
Tiberio	677421242		Miembro	Tiberio
Víctor	649385531		Miembro	Trezeh
Alberto	649012195		Miembro	Wini
\\\\0110\\\\	692152162		Miembro	
HECTOR	608822457		Miembro	
Charlie otro	680235901		Miembro	
Cristian	630073396		Miembro	
David Jiménez Berrocosa	686997173		Miembro	Kaka
Javi	651315262		Miembro	
Desconocido	650662778		Miembro	`;

const lines = rawData.split('\n').filter(l => l.trim() !== '');
const headers = lines[0]; // skip headers
const rows = lines.slice(1).map(line => {
    const parts = line.split('\t');
    const nombre = parts[0]?.trim() || '';
    const telefono = parts[1]?.trim() || '';
    const email = parts[2]?.trim() || '';
    const rol = parts[3]?.trim() || '';
    const apodo = parts[4]?.trim() || '';
    
    return `('${nombre.replace(/'/g, "''")}', '${telefono}', '${email}', '${rol}', '${apodo.replace(/'/g, "''")}')`;
});

const sql = `-- IMPORTACIÓN MASIVA DE MIEMBROS
CREATE TEMP TABLE temp_import (
  nombre text,
  telefono text,
  email text,
  rol text,
  apodo text
);

INSERT INTO temp_import VALUES
${rows.join(',\n')};

DO $$
DECLARE
  r RECORD;
  new_uid UUID;
  clean_email TEXT;
  clean_nickname TEXT;
  target_role_id UUID;
BEGIN
  -- Apagamos el trigger de history para evitar bloqueos durante importación masiva
  DROP TRIGGER IF EXISTS log_profiles_history ON profiles;
  
  FOR r IN SELECT * FROM temp_import LOOP
    -- Generar email fake si no tiene
    clean_email := COALESCE(NULLIF(r.email, ''), translate(lower(replace(r.apodo, ' ', '')), 'áéíóú', 'aeiou') || '@mafiapp.local');
    IF clean_email IS NULL OR clean_email = '@mafiapp.local' THEN
      clean_email := translate(lower(replace(r.nombre, ' ', '')), 'áéíóú', 'aeiou') || '@mafiapp.local';
    END IF;
    
    clean_nickname := COALESCE(NULLIF(r.apodo, ''), r.nombre);
    
    IF r.rol = 'Administrador' THEN
      SELECT id INTO target_role_id FROM roles WHERE name = 'admin' LIMIT 1;
    ELSE
      SELECT id INTO target_role_id FROM roles WHERE name = 'member' LIMIT 1;
    END IF;

    -- Comprobar si el usuario ya existe por email
    SELECT id INTO new_uid FROM auth.users WHERE email = clean_email;
    
    IF new_uid IS NULL THEN
      new_uid := gen_random_uuid();
      
      -- Crear en auth.users (contraseña por defecto: mafiapp2026)
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
      ) VALUES (
        new_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', clean_email, crypt('mafiapp2026', gen_salt('bf')), NOW(), NOW(), NOW()
      );
      
      -- El trigger handle_new_user habrá creado el profile y member básicos. Actualizamos:
      UPDATE profiles SET phone = r.telefono WHERE id = new_uid;
      UPDATE members SET nickname = clean_nickname, role_id = target_role_id WHERE profile_id = new_uid;
    ELSE
      -- Si ya existe, nos aseguramos de que su profile y member existan por si acaso (sync_users logic)
      IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = new_uid) THEN
        INSERT INTO profiles (id, email, phone) VALUES (new_uid, clean_email, r.telefono);
      ELSE
        UPDATE profiles SET phone = r.telefono WHERE id = new_uid;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM members WHERE profile_id = new_uid) THEN
        INSERT INTO members (profile_id, nickname, role_id) VALUES (new_uid, clean_nickname, target_role_id);
      ELSE
        UPDATE members SET nickname = clean_nickname, role_id = target_role_id WHERE profile_id = new_uid;
      END IF;
    END IF;
  END LOOP;
END $$;
`;

fs.writeFileSync('c:/Users/soyel/Downloads/MafiAPP/import_members.sql', sql);
console.log('Script SQL generado!');
