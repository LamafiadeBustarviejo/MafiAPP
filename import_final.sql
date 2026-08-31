DO $$ 
DECLARE
  new_uid UUID;
  target_role_id UUID;
  r RECORD;
BEGIN
  -- Iteramos sobre los 42 usuarios
  FOR r IN (
    SELECT 'kotufa10@hotmail.com' as email, 'Aitor Martinez Garcia' as nombre, '646539495' as telefono, 'member' as rol, 'Kotufa' as apodo UNION ALL
    SELECT 'soco@mafiapp.local', 'Álvaro Pascual Plaza', '616324026', 'member', 'Soco' UNION ALL
    SELECT 'andrea@mafiapp.local', 'Andrea', '659411144', 'member', 'Andrea' UNION ALL
    SELECT 'beni@mafiapp.local', 'beni carlo', '617805054', 'member', 'Beni' UNION ALL
    SELECT 'borja@mafiapp.local', 'Borja', '660378730', 'member', 'Borji' UNION ALL
    SELECT 'brian@mafiapp.local', 'Brian', '606897468', 'member', 'Brian' UNION ALL
    SELECT 'Bubillotron_87@hotmail.com', 'Juan Manuel', '680235702', 'admin', 'Bubillo' UNION ALL
    SELECT 'chus@mafiapp.local', 'Chus', '618105988', 'member', 'Chus' UNION ALL
    SELECT 'jabali@mafiapp.local', 'Dani Jara', '628630661', 'member', 'Jabalí' UNION ALL
    SELECT 'sederap86@hotmail.com', 'David García García', '686281242', 'admin', 'Paredes' UNION ALL
    SELECT 'diegolbdm11@gmail.com', 'Diego Baonza del Moral', '626465856', 'admin', 'Diego' UNION ALL
    SELECT 'info@jardineriamaragil.com', 'Miguel Aranguren', '638043836', 'admin', 'Miki' UNION ALL
    SELECT 'estefania@mafiapp.local', 'Estefanía', '691260175', 'member', 'Estefanía' UNION ALL
    SELECT 'hugo@mafiapp.local', 'Hugo Sanchez', '660249129', 'member', 'Huguero' UNION ALL
    SELECT 'mecanitron_88@hotmail.com', 'Ismael mecánico', '618369776', 'admin', 'Meca' UNION ALL
    SELECT 'javipuskas@mafiapp.local', 'Javi mafias', '669351727', 'member', 'Javi puskas' UNION ALL
    SELECT 'javiculo@mafiapp.local', 'Javier Celada Rodriguez', '626289756', 'member', 'Javi culo' UNION ALL
    SELECT 'djimenolagrutta@gmail.com', 'Daniel Jimeno', '626921284', 'admin', 'Jime' UNION ALL
    SELECT 'jorge@mafiapp.local', 'jorge romero', '620655195', 'member', 'RICHELIER' UNION ALL
    SELECT 'kabezas@mafiapp.local', 'Alberto Ballesteros', '660937920', 'member', 'Kabezas' UNION ALL
    SELECT 'ruben@mafiapp.local', 'Ruben Cebrián', '647055822', 'admin', 'Karateja' UNION ALL
    SELECT 'Colladochef@gmail.com', 'Carlos Collado', '628824948', 'admin', 'Carlón' UNION ALL
    SELECT 'manu@mafiapp.local', 'Manu Rasca', '680582717', 'member', 'Manu' UNION ALL
    SELECT 'poty@mafiapp.local', 'Miguel Angel Ballesteros', '676203844', 'admin', 'Poty' UNION ALL
    SELECT 'oscardj@mafiapp.local', 'Oscar dj', '665280503', 'member', 'Muñekas' UNION ALL
    SELECT 'oscarpeluso@mafiapp.local', 'Oscar Peluso', '606528070', 'member', 'Peluso' UNION ALL
    SELECT 'paul_ofthevalley@hotmail.com', 'Pablo Del Valle', '680176594', 'admin', 'Terrores' UNION ALL
    SELECT 'barrullitas@hotmail.com', 'Pablo Romero Plaza', '659333315', 'admin', 'Barrullas' UNION ALL
    SELECT 'polete@mafiapp.local', 'Paul Miraflores', '659320778', 'member', 'Polete' UNION ALL
    SELECT 'R19martin@gmail.com', 'Ruben Martin Gallego', '620593764', 'member', 'Rubencio' UNION ALL
    SELECT 'tiberio@mafiapp.local', 'Tiberio', '677421242', 'member', 'Tiberio' UNION ALL
    SELECT 'trezeh@mafiapp.local', 'Víctor', '649385531', 'member', 'Trezeh' UNION ALL
    SELECT 'wini@mafiapp.local', 'Alberto', '649012195', 'member', 'Wini' UNION ALL
    SELECT '0110@mafiapp.local', '\0110\', '692152162', 'member', '0110' UNION ALL
    SELECT 'hector@mafiapp.local', 'HECTOR', '608822457', 'member', 'Hector' UNION ALL
    SELECT 'charlieotro@mafiapp.local', 'Charlie otro', '680235901', 'member', 'Charlie otro' UNION ALL
    SELECT 'cristian@mafiapp.local', 'Cristian', '630073396', 'member', 'Cristian' UNION ALL
    SELECT 'kaka@mafiapp.local', 'David Jiménez Berrocosa', '686997173', 'member', 'Kaka' UNION ALL
    SELECT 'javi@mafiapp.local', 'Javi', '651315262', 'member', 'Javi' UNION ALL
    SELECT 'desconocido@mafiapp.local', 'Desconocido', '650662778', 'member', 'Desconocido'
  ) LOOP
    
    -- Evitar duplicados como soyelcharly o cherrykittles si ya están en auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = r.email) THEN
      CONTINUE;
    END IF;

    -- Buscar el rol correcto
    SELECT id INTO target_role_id FROM public.roles WHERE name = r.rol LIMIT 1;
    
    -- Generar nuevo UUID para el usuario
    new_uid := gen_random_uuid();
    
    -- 1. Insertar el usuario en la tabla de autenticación con todos los metadatos perfectos
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at, confirmation_token, 
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated', r.email, crypt('mafiapp2026', gen_salt('bf')),
      now(), now(), now(), '', 
      '{"provider":"email","providers":["email"]}'::jsonb, 
      jsonb_build_object('name', r.nombre), 
      false
    );
    
    -- 2. Insertar la identidad de seguridad (ESTO EVITA EL ERROR 500)
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), new_uid, 
      format('{"sub":"%s","email":"%s","email_verified":false,"phone_verified":false}', new_uid, r.email)::jsonb, 
      'email', r.email, now(), now(), now()
    );
    
    -- (El trigger handle_new_user ya ha creado la fila en profiles a estas alturas)
    
    -- 3. Actualizamos el perfil con el teléfono
    UPDATE public.profiles SET phone = r.telefono WHERE id = new_uid;
    
    -- 4. Creamos su ficha de miembro con su apodo y rol
    INSERT INTO public.members (profile_id, nickname, role_id)
    VALUES (new_uid, COALESCE(r.apodo, split_part(r.email, '@', 1)), target_role_id);
    
  END LOOP;
END $$;
