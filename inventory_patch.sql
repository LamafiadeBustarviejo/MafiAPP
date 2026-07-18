-- 1. Eliminar el constraint antiguo de status
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_status_check;

-- 2. Añadir el nuevo constraint con 'in_use'
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_status_check CHECK (status IN ('available', 'borrowed', 'in_use', 'broken', 'lost', 'archived'));

-- 3. Añadir la columna de cantidad obligatoria (por defecto 1 para los existentes)
ALTER TABLE inventory_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0);
