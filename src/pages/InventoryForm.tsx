import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '@/services/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { EVENTS } from '@/lib/constants'

// Validaciones
const formSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  category_id: z.string().nullish(),
  owner_id: z.string().nullish(),
  quantity: z.coerce.number().min(1, 'La cantidad mínima es 1'),
  location: z.string().nullish(),
  description: z.string().nullish(),
  event: z.string().nullish(),
  status: z.enum(['available', 'borrowed', 'in_use', 'broken', 'lost', 'archived'])
})

type FormData = z.infer<typeof formSchema>

export function InventoryForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Queries
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: inventoryService.getMembers })
  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryService.getItem(id!),
    enabled: isEditing
  })

  // Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      status: 'available',
      location: '',
      description: ''
    }
  })

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        category_id: item.category_id,
        owner_id: item.owner_id || '',
        quantity: item.quantity,
        location: item.location || '',
        description: item.description || '',
        event: item.event || '',
        status: item.status
      })
    }
  }, [item, reset])

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        event: data.event || null,
        owner_id: data.owner_id || null
      }
      if (isEditing) {
        return inventoryService.updateItem(id!, payload as any)
      } else {
        return inventoryService.createItem(payload as any)
      }
    },
    onSuccess: (savedItem) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      navigate(`/inventory/${savedItem.id}`)
    }
  })

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data)
  }

  if (isEditing && isLoadingItem) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-zinc-400">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>{isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del objeto *</Label>
              <Input id="name" {...register('name')} className="bg-zinc-950 border-zinc-800 text-zinc-100" placeholder="Ej: Mesa plegable blanca" />
              {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label htmlFor="event">Sirve para (Evento)</Label>
                <select 
                  id="event" 
                  {...register('event')} 
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Ninguno / General</option>
                  {EVENTS.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_id">Propietario / Responsable *</Label>
                <select 
                  id="owner_id" 
                  {...register('owner_id')} 
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Selecciona...</option>
                  {members?.map(m => (
                    <option key={m.id} value={m.id}>{m.nickname}</option>
                  ))}
                </select>
                {errors.owner_id && <span className="text-xs text-red-500">{errors.owner_id.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad *</Label>
                <Input id="quantity" type="number" min="1" {...register('quantity')} className="bg-zinc-950 border-zinc-800 text-zinc-100" />
                {errors.quantity && <span className="text-xs text-red-500">{errors.quantity.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select 
                  id="status" 
                  {...register('status')} 
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="available">Disponible</option>
                  <option value="borrowed">Prestado</option>
                  <option value="in_use">En uso</option>
                  <option value="broken">Dañado</option>
                  <option value="lost">Perdido</option>
                  <option value="archived">Descatalogado</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación física</Label>
              <Input id="location" {...register('location')} className="bg-zinc-950 border-zinc-800 text-zinc-100" placeholder="Ej: Armario principal, Balda 2" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notas / Descripción</Label>
              <textarea 
                id="description" 
                {...register('description')} 
                className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                placeholder="Observaciones sobre el objeto..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Artículo
              </Button>
            </div>
            
            {saveMutation.isError && (
              <p className="text-red-500 text-sm text-right mt-2">Error al guardar: {(saveMutation.error as Error).message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
