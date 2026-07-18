CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insertamos el perfil base
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Para que puedas probar todo de inmediato, te crearemos automáticamente 
  -- un registro en la tabla de miembros como Administrador usando la primera parte de tu email como nombre
  INSERT INTO public.members (profile_id, nickname, role_id)
  VALUES (
    new.id, 
    split_part(new.email, '@', 1), 
    (SELECT id FROM public.roles WHERE name = 'admin' LIMIT 1)
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Si algo falla en nuestras tablas, al menos permitimos que el usuario de Auth se cree
  -- para que no te bloquee el panel de Supabase
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
