-- IMPORTACIÓN MASIVA DE INVENTARIO
CREATE TEMP TABLE temp_inventory (
  nombre text,
  descripcion text,
  ubicacion text
);

INSERT INTO temp_inventory VALUES
('Nevera Portátil IGLOO 85L', 'Comprada en 2024, con ruedas. Guardada.', 'Almacén de la barra del Star'),
('Paellera grande y fuego', 'Para eventos grandes. Fuego revisado.', 'Garaje de Isma'),
('Carro de la peña', 'Carro de transporte de material.', 'Garaje de Miki (provisional)'),
('2 Banderas de la peña', 'Una con palo (negra) y otra sin palo (blanca).', 'Casa de Cherry / Miki'),
('Abridores eléctricos y manuales', '1 eléctrico funcional y 3-4 manuales.', 'Casa de Miki'),
('Cubo grande para Zurra/Bebida', 'Cubo negro de plástico, grande.', 'Casa de Diego'),
('2 Sacacorchos eléctricos', 'Comprados en Amazon', 'Bubi'),
('6 Sacacorchos manuales', 'Comprados en Amazon', 'Bubi'),
('Manguera (Empalme)', 'Para llenar la piscina', 'Miki');

DO $$
DECLARE
  r RECORD;
  found_owner_id UUID;
  default_category_id UUID;
BEGIN
  -- Apagamos el trigger de history de inventario
  DROP TRIGGER IF EXISTS log_inventory_history ON inventory_items;
  
  -- Asegurarnos de que exista al menos una categoría por defecto
  SELECT id INTO default_category_id FROM inventory_categories WHERE name = 'Material' LIMIT 1;
  IF default_category_id IS NULL THEN
    default_category_id := gen_random_uuid();
    INSERT INTO inventory_categories (id, name, icon) VALUES (default_category_id, 'Material', 'box');
  END IF;
  
  FOR r IN SELECT * FROM temp_inventory LOOP
    found_owner_id := NULL;
    
    -- Intentar buscar al miembro que lo custodia según el texto de la ubicación
    -- Esto es opcional, pero asignará "custodia" automáticamente si detecta un nombre conocido
    SELECT id INTO found_owner_id 
    FROM members 
    WHERE 
       -- Busca si el apodo está contenido en la ubicación
       lower(r.ubicacion) ILIKE '%' || lower(nickname) || '%'
       -- Añadimos casos específicos comunes por si no matchean directamente
       OR (lower(r.ubicacion) ILIKE '%isma%' AND lower(nickname) ILIKE '%meca%')
       OR (lower(r.ubicacion) ILIKE '%diego%' AND lower(nickname) ILIKE '%dieguete%')
       OR (lower(r.ubicacion) ILIKE '%bubi%' AND lower(nickname) ILIKE '%bubillo%')
    LIMIT 1;

    INSERT INTO inventory_items (name, description, category_id, location, owner_id, status, created_at, updated_at)
    VALUES (
      r.nombre,
      r.descripcion,
      default_category_id,
      r.ubicacion,
      found_owner_id,
      'available', -- Por defecto disponible
      NOW(),
      NOW()
    );
  END LOOP;
  
END $$;
