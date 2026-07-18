-- 1. Añadir el campo de teléfono a los perfiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Modificar el trigger de nuevos usuarios para que por defecto sean 'member' (y no admin)
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insertamos el perfil base
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Generamos el miembro asociado con el rol por defecto de "Miembro"
  INSERT INTO public.members (profile_id, nickname, role_id)
  VALUES (
    new.id, 
    split_part(new.email, '@', 1), 
    (SELECT id FROM public.roles WHERE name = 'member' LIMIT 1)
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
