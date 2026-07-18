import fs from 'fs';

const rawData = `ID	Título	Descripción	Asignado a	Estado
1	Recaudar cuotas de la peña (60€)	Contactar con todos los miembros y gestionar el pago. Actualizar la lista de pagados.	Ismael mecánico	En progreso
2	Gestionar bote y pagos del local	Contar el bote del año anterior. Pagar alquiler, seguro, limpieza y gastos del local.	BUBILLO	En progreso
3	Asistir a reunión de peñas	Acudir el 19 de Julio para exponer el plan del 25 aniversario y coordinar con el ayuntamiento.	Cherry Alvarito Mvl	Pendiente
4	Gestionar subvención de comida y menaje	Presentar el presupuesto del cocido y la lista de menaje (platos, vasos, etc.) para que el Ayto. lo cubra.	Cherry Alvarito Mvl	En progreso
5	Solicitar material municipal	Pedir vallas, tablones, borriquetas, fuego, perola, manguera y cubos de basura para los eventos.	Poty	Hecho
6	Organizar Queimada del viernes	Comprar aguardiente, café, limones, naranjas y azúcar. Carlon se encarga de la preparación.	Terrores Pablis	En progreso
7	Organizar Comida del Sábado	Encargar paellas/pollos, tortillas y bebida. Gestionar mesas. Cobrar a los asistentes para generar bote extra.	Terrores Pablis	Pendiente
8	Preparar Cocido Asturiano del Domingo	Comprar todos los ingredientes y cocinar para 400+ raciones. Coordinar con ayudantes para el servicio.	Carlon Mvl	En progreso
9	Coordinar grupo de música "Poleyfors4"	Cerrar detalles de horario (14:00h Domingo) y necesidades técnicas (altavoces). Atenderles durante el evento.	Poty	En progreso
10	Encargar y recibir las sidras	Realizar el pedido final de 45 cajas a Sidra Cortina y coordinar la entrega en el almacén municipal.	Poty	Hecho
11	Comprar cervezas y otras bebidas	Aprovechar ofertas para comprar cerveza (Mahou clásica), tinto de verano, mixtas y refrescos.	Poty	Hecho
12	Gestionar el hielo para las fiestas	Encargar 28 sacas a Chus en dos tandas (jueves y sábado) y almacenarlas en los arcones.	Barrullitas Mvl	Pendiente
13	Gestionar arcones y neveras	Probar que el arcón de Diego funcione. Coordinar con Kaka la traída de sus neveras. Dejarlos listos en el local.	Barrullitas Mvl	En progreso
14	Comprar embutido para el Domingo	Comprar lomo, chorizo y salchichón ibérico. Dejar la cortadora lista para preparar las raciones.	Polete Lewis	Pendiente
15	Gestionar pedido de Americanas	Recoger las americanas de prueba, gestionar tallas con los miembros y hacer el pedido final.	Kárateka Mvl	En progreso
16	Gestionar serigrafía de ropa y pañuelos	Enviar diseños a la imprenta y supervisar la producción de camisetas, polos, americanas y pañuelos.	Dieguete Mvl	En progreso
17	Diseñar logos y cartelería	Crear los diseños para la ropa del 25 aniversario y los carteles de los eventos (Queimada y Día de Asturias).	Charly Chankete After China	Hecho
18	Preparar discurso del 25 Aniversario	Escribir y preparar un discurso/brindis para el momento de la queimada o el domingo.	Charly Chankete After China	Pendiente
19	Arreglar y adaptar carro de la peña	Llevar el carro a Tibur para repararlo y soldar una plataforma para la nevera y un altavoz.	BUBILLO	En progreso
20	Hacer diseño cartel fiestas	Diseñar y difundir cartel con programación (Viernes Queimada, Sábado comida garito, Domingo sidras, cocido y Poleyfors4).	Charly Chankete After China	Hecho
21	Hacer pañuelos 25º aniversario	Diseñar y pedir 90 pañuelos para repartir a los de la peña.	Dieguete Mvl	En progreso
22	Alquiler y limpieza local	Gestionar el alquiler del local de Mari Jose por 300€ más limpieza y luz/agua.	BUBILLO	En progreso
23	Comprar Hielos (Chus)	Asegurar 14 sacos para el jueves y 14 sacos para el sábado con Chus.	Barrullitas Mvl	En progreso
24	Contratar Música/Charanga	Gestionar grupo Pop Rock (Poleyfors4) gratis o charanga (NEW PDT).	Poty / Jimeno	En progreso
25	Comida del sábado	Organizar comida en el local (paellas Marcela/Tramontana o catering).	Terrores Pablis	En progreso`;

const lines = rawData.split('\n').filter(l => l.trim() !== '');
const headers = lines[0]; // skip headers
const rows = lines.slice(1).map(line => {
    const parts = line.split('\t');
    const id = parts[0]?.trim() || '';
    const titulo = parts[1]?.trim() || '';
    const desc = parts[2]?.trim() || '';
    const asignado = parts[3]?.trim() || '';
    const estado_raw = parts[4]?.trim() || '';
    
    let estado = 'pending';
    if (estado_raw.toLowerCase().includes('progreso')) estado = 'in_progress';
    if (estado_raw.toLowerCase().includes('hecho') || estado_raw.toLowerCase().includes('completado')) estado = 'completed';
    
    // Escapar comillas simples
    const safeTitle = titulo.replace(/'/g, "''");
    const safeDesc = desc.replace(/'/g, "''");
    const safeAsignado = asignado.replace(/'/g, "''");
    
    return `('${safeTitle}', '${safeDesc}', '${safeAsignado}', '${estado}')`;
});

const sql = `-- IMPORTACIÓN MASIVA DE TAREAS
CREATE TEMP TABLE temp_tasks (
  titulo text,
  descripcion text,
  asignado text,
  estado text
);

INSERT INTO temp_tasks VALUES
${rows.join(',\n')};

DO $$
DECLARE
  r RECORD;
  found_assignee_id UUID;
  admin_creator_id UUID;
  final_desc TEXT;
BEGIN
  -- Apagamos el trigger de history de tareas para no saturar el registro de auditoría con la importación
  DROP TRIGGER IF EXISTS log_tasks_history ON tasks;
  
  -- Buscar un admin que actúe de creador de estas tareas
  SELECT m.id INTO admin_creator_id 
  FROM members m 
  JOIN roles ro ON m.role_id = ro.id 
  WHERE ro.name = 'admin' 
  LIMIT 1;
  
  FOR r IN SELECT * FROM temp_tasks LOOP
    found_assignee_id := NULL;
    
    -- Intentar buscar al miembro por su apodo (fuzzy match)
    SELECT id INTO found_assignee_id 
    FROM members 
    WHERE 
       lower(r.asignado) ILIKE '%' || lower(nickname) || '%'
       OR lower(nickname) ILIKE '%' || split_part(lower(r.asignado), ' ', 1) || '%'
       OR (lower(r.asignado) ILIKE '%barrullitas%' AND lower(nickname) ILIKE '%barrullas%')
       OR (lower(r.asignado) ILIKE '%dieguete%' AND lower(nickname) ILIKE '%diego%')
       OR (lower(r.asignado) ILIKE '%pablis%' AND lower(nickname) ILIKE '%pablo%')
       OR (lower(r.asignado) ILIKE '%chankete%' AND lower(nickname) ILIKE '%chankete%')
    LIMIT 1;

    -- Construimos la descripción añadiendo quiénes eran los asignados originales por si hay varios o falla el match
    final_desc := r.descripcion || E'\n\n**(Asignatarios originales:** ' || r.asignado || ')';

    INSERT INTO tasks (title, description, assignee_id, status, priority, created_by, created_at, updated_at)
    VALUES (
      r.titulo,
      final_desc,
      found_assignee_id,
      r.estado,
      'medium',
      admin_creator_id,
      NOW(),
      NOW()
    );
  END LOOP;
  
  -- Restaurar el trigger (opcional, pero buena práctica si quieres recuperar el historial a partir de ahora)
  -- CREATE TRIGGER log_tasks_history AFTER INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION log_history();
END $$;
`;

fs.writeFileSync('c:/Users/soyel/Downloads/MafiAPP/import_tasks.sql', sql);
console.log('Script SQL de tareas generado!');
