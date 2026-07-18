-- 1. Quitamos el trigger de historial para los perfiles, ya que suele dar problemas 
-- cuando es el sistema de autenticación el que crea los registros.
DROP TRIGGER IF EXISTS log_profiles_history ON profiles;

-- 2. Sincronizamos cualquier usuario que ya esté en Auth pero falte en nuestra app
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN SELECT id, email FROM auth.users LOOP
    -- Crear el perfil si no existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = r.id) THEN
      INSERT INTO profiles (id, email) VALUES (r.id, r.email);
    END IF;
    
    -- Crear el miembro si no existe (y asignarle rol admin por ser el primero)
    IF NOT EXISTS (SELECT 1 FROM members WHERE profile_id = r.id) THEN
      INSERT INTO members (profile_id, nickname, role_id) 
      VALUES (
        r.id, 
        split_part(r.email, '@', 1), 
        (SELECT id FROM roles WHERE name = 'admin' LIMIT 1)
      );
    END IF;
  END LOOP;
END $$;
