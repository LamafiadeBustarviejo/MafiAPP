-- ===================================================================================
-- SCRIPT PARA SOLUCIONAR PERMISOS RLS (Row Level Security) EN TODA LA APLICACIÓN
-- ===================================================================================

-- 1. INVENTARIO
CREATE POLICY "Authenticated users can insert inventory" ON inventory_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update inventory" ON inventory_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert inventory movements" ON inventory_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can select inventory movements" ON inventory_movements FOR SELECT USING (auth.role() = 'authenticated');

-- 2. TAREAS
CREATE POLICY "Authenticated users can insert tasks" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update tasks" ON tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete tasks" ON tasks FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert task comments" ON task_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update task comments" ON task_comments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can select task comments" ON task_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete task comments" ON task_comments FOR DELETE USING (auth.role() = 'authenticated');

-- 3. FINANZAS
-- (La de SELECT y la de INSERT ya existían en algunas tablas, usamos IF NOT EXISTS donde sea posible o simplemente las recreamos asegurándonos de no duplicar)
DROP POLICY IF EXISTS "Authenticated users can insert finances" ON financial_movements;
CREATE POLICY "Authenticated users can insert finances" ON financial_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update finances" ON financial_movements FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can select financial attachments" ON financial_attachments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert financial attachments" ON financial_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. MIEMBROS (Solo lectura estaba, permitimos update a admins y a sí mismos)
CREATE POLICY "Authenticated users can update members" ON members FOR UPDATE USING (auth.role() = 'authenticated');

-- Habilitar explícitamente RLS en las tablas que faltaban por si acaso
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_attachments ENABLE ROW LEVEL SECURITY;
