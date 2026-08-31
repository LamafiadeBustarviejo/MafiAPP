import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksService } from '@/services/tasks'
import { inventoryService } from '@/services/inventory'
import { membersService } from '@/services/members'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Save, Paperclip } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { EVENTS } from '@/lib/constants'
import type { TaskStatus, TaskPriority } from '@/types'

const formSchema = z.object({
  title: z.string().min(3, 'El título es muy corto'),
  assignee_id: z.string().min(1, 'Debes asignar un responsable'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'archived']),
  due_date: z.string().optional().nullable(),
  event: z.string().nullish(),
  description: z.string().optional().nullable()
})

type FormData = z.infer<typeof formSchema>

export function TaskForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAuth()

  // Queries
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: inventoryService.getMembers })
  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksService.getTask(id!),
    enabled: isEditing
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => membersService.getCurrentMember(session!.user.id),
    enabled: !!session?.user.id
  })

  // Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priority: 'medium',
      status: 'pending',
      due_date: '',
      description: ''
    }
  })

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        assignee_id: task.assignee_id || '',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        event: task.event || '',
        description: task.description || ''
      })
    }
  }, [task, reset])

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      let attachmentUrl = task?.attachment_url || null
      let attachmentName = task?.attachment_name || null

      if (selectedFile) {
        const uploadResult = await tasksService.uploadTaskAttachment(selectedFile)
        attachmentUrl = uploadResult.url
        attachmentName = uploadResult.name
      }

      // Clean empty dates
      const payload = {
        ...data,
        due_date: data.due_date || null,
        event: data.event || null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName
      }
      if (isEditing) {
        return tasksService.updateTask(id!, payload)
      } else {
        if (!currentMember) throw new Error("No se ha podido cargar tu perfil de peñista.")
        return tasksService.createTask({
          ...payload,
          created_by: currentMember.id,
        })
      }
    },
    onSuccess: (savedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      navigate(`/tasks/${savedTask.id}`)
    }
  })

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data)
  }

  if (isEditing && isLoadingTask) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-zinc-400">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
      </Button>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="title">Título de la tarea *</Label>
              <Input id="title" {...register('title')} className="bg-zinc-950 border-zinc-800 text-zinc-100" placeholder="Ej: Comprar el hielo" />
              {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignee_id">Responsable *</Label>
                <select 
                  id="assignee_id" 
                  {...register('assignee_id')} 
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                >
                  <option value="">Selecciona...</option>
                  {members?.filter(m => m.status !== 'inactive' || m.id === task?.assignee_id).map(m => (
                    <option key={m.id} value={m.id}>{m.nickname}</option>
                  ))}
                </select>
                {errors.assignee_id && <span className="text-xs text-red-500">{errors.assignee_id.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha Límite</Label>
                <Input id="due_date" type="date" {...register('due_date')} className="bg-zinc-950 border-zinc-800 text-zinc-100 [color-scheme:dark]" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="event">Relacionado con (Evento)</Label>
                <select 
                  id="event" 
                  {...register('event')} 
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                >
                  <option value="">Ninguno / General</option>
                  {EVENTS.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <select 
                  id="priority" 
                  {...register('priority')} 
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <select 
                    id="status" 
                    {...register('status')} 
                    className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="archived">Archivada</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción detallada</Label>
              <textarea 
                id="description" 
                {...register('description')} 
                className="flex min-h-[100px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500" 
                placeholder="Detalles sobre lo que hay que hacer..."
              />
            </div>

            <div className="space-y-2">
              <Label>Archivo Adjunto (Opcional)</Label>
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="bg-zinc-950 border-zinc-800 text-zinc-300"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Seleccionar Archivo
                </Button>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0])
                    }
                  }}
                />
                <div className="text-sm text-zinc-400">
                  {selectedFile ? (
                    <span className="text-emerald-400 font-medium">{selectedFile.name}</span>
                  ) : task?.attachment_name ? (
                    <span>Archivo actual: <span className="text-indigo-400">{task.attachment_name}</span></span>
                  ) : (
                    <span>Ningún archivo seleccionado</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="text-zinc-400">
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Tarea
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
