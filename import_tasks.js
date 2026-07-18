import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
)

const tasksToInsert = [
  // ZURRA
  { title: "Comprar ingredientes base de la zurra en Makro/Día", description: "50L de vino, 30L de zumos variados, melocotón en almíbar, 1 botella de Larios/alcohol duro, canela en rama.", event: "Zurra" },
  { title: "Comprar fruta fresca el mismo día del evento", description: "", event: "Zurra" },
  { title: "Fregar y preparar el cubo grande para la mezcla", description: "", event: "Zurra" },
  { title: "Dejar macerando la fruta y preparar la mezcla de la zurra", description: "", event: "Zurra" },
  { title: "Comprar vasos pequeños para el reparto (aprox. 800)", description: "", event: "Zurra" },
  { title: "Confirmar ubicación del evento y horario", description: "ej. a las 18:30 en el Corralón / donde Cris", event: "Zurra" },
  { title: "Llevar mesa al lugar para usarla de barra / para las regatas", description: "", event: "Zurra" },
  { title: "Preparar y conectar equipo de música/mesa de mezclas", description: "", event: "Zurra" },

  // COMIDA DE PEÑA
  { title: "Comprar embutido (chorizo y salchichón)", description: "", event: "Comida de Peña" },
  { title: "Cortar el embutido previamente y guardarlo en fiambreras", description: "", event: "Comida de Peña" },
  { title: "Encargar pan (aprox. 20-25 barras)", description: "", event: "Comida de Peña" },
  { title: "Hablar con Terry para guardar en su nevera las sobras de comida del viernes", description: "", event: "Comida de Peña" },
  { title: "Preparar los bocadillos para la peña el domingo", description: "", event: "Comida de Peña" },

  // SIDRAS ASTURIANAS
  { title: "Transportar arcones y neveras (ej. arcón de Diego) al Malecón o Casilla", description: "", event: "Sidras asturianas" },
  { title: "Enchufar y probar los arcones el fin de semana anterior para asegurar que enfrían", description: "", event: "Sidras asturianas" },
  { title: "Comprar y recepcionar hielo (aprox. 110-120 sacos encargados a Chus)", description: "", event: "Sidras asturianas" },
  { title: "Comprar o revisar el estado de la piscina hinchable para enfriar botellas", description: "", event: "Sidras asturianas" },
  { title: "Conseguir manguera de 80-100 metros y punto de agua para llenar la piscina", description: "", event: "Sidras asturianas" },
  { title: "Pagar la limpieza del local post-fiestas (85€) y organizar recogida", description: "", event: "Sidras asturianas" },
  { title: "Coordinar presupuesto, encargar y recepcionar 44-45 cajas de sidra asturiana", description: "", event: "Sidras asturianas" },
  { title: "Comprar abridores/sacacorchos de calidad (8-10 manuales o 5 eléctricos)", description: "", event: "Sidras asturianas" },
  { title: "Comprar vasos de sidra (aprox. 800-1000 vasos)", description: "", event: "Sidras asturianas" },
  { title: "Comprar botellines y latas de cerveza (Mahou, Radler, 0,0) como alternativa", description: "", event: "Sidras asturianas" },
  { title: "Gestionar subvención del Ayuntamiento para los chorizos (350€)", description: "", event: "Sidras asturianas" },
  { title: "Encargar 400 chorizos (aprox. 280€)", description: "", event: "Sidras asturianas" },
  { title: "Encargar 80 barras de pan", description: "a incluir en la factura de la cena del toro con Salva", event: "Sidras asturianas" },
  { title: "Conseguir equipamiento para cocinar: cazuela grande, aros de gas y soporte", description: "", event: "Sidras asturianas" },
  { title: "Fregar y devolver la cazuela tras el evento", description: "", event: "Sidras asturianas" },
  { title: "Pedir presupuesto, contratar y pagar a la Charanga (3 horas)", description: "", event: "Sidras asturianas" },
  { title: "Enviar factura de la Charanga al Ayuntamiento para la subvención", description: "", event: "Sidras asturianas" },
  { title: "Gestionar punto de luz oficial para enchufar equipos", description: "", event: "Sidras asturianas" },
  { title: "Instalar altavoces y mesa de mezclas para que pinchen los DJs de la peña", description: "", event: "Sidras asturianas" }
]

async function run() {
  const { data: admin } = await supabase.from('members').select('id').limit(1).single()
  
  if (!admin) {
    console.error("No member found for created_by")
    return
  }
  
  const creatorId = admin.id
  console.log(`Using member ${creatorId} as creator...`)

  for (const t of tasksToInsert) {
    const { error } = await supabase.from('tasks').insert({
      title: t.title,
      description: t.description || null,
      event: t.event,
      created_by: creatorId,
      status: 'pending'
    })
    
    if (error) {
      console.error(`Error inserting task "${t.title}":`, error)
    } else {
      console.log(`Inserted: ${t.title}`)
    }
  }
  console.log("Done!")
}

run().catch(console.error)
