-- 1. Actualizar el constraint de la tabla tasks para permitir 'cancelled'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'archived'));

-- 2. Añadir la columna updated_at a la tabla task_comments para rastrear las ediciones
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Crear el trigger para que updated_at se actualice automáticamente en los comentarios
DROP TRIGGER IF EXISTS update_task_comments_modtime ON task_comments;
CREATE TRIGGER update_task_comments_modtime 
BEFORE UPDATE ON task_comments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Crear el trigger para que las ediciones de comentarios queden registradas en el historial (history)
DROP TRIGGER IF EXISTS log_task_comments_history ON task_comments;
CREATE TRIGGER log_task_comments_history 
AFTER INSERT OR UPDATE ON task_comments 
FOR EACH ROW EXECUTE FUNCTION log_history();
