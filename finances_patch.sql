-- 1. Modificamos el constraint de los tipos de movimientos para incluir 'fee' (cuota)
ALTER TABLE financial_movements DROP CONSTRAINT IF EXISTS financial_movements_type_check;
ALTER TABLE financial_movements ADD CONSTRAINT financial_movements_type_check CHECK (type IN ('income', 'expense', 'fee'));

-- 2. Añadimos la columna de categoría
ALTER TABLE financial_movements ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Otros';

-- 3. Preparamos el RLS para el Storage de Supabase (por si ya creas el bucket llamado "receipts")
-- Nota: La creación del bucket en sí hay que hacerla manual desde el panel
CREATE POLICY "Receipts are viewable by everyone" ON storage.objects FOR SELECT USING ( bucket_id = 'receipts' );
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'receipts' AND auth.role() = 'authenticated' );

-- 4. Añadimos FK a history para que funcione el join de auditoría
ALTER TABLE history DROP CONSTRAINT IF EXISTS history_performed_by_fkey;
ALTER TABLE history ADD CONSTRAINT history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES profiles(id) ON DELETE SET NULL;
