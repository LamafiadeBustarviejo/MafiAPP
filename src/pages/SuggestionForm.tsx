import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { suggestionsService } from '@/services/suggestions'
import { membersService } from '@/services/members'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Send } from 'lucide-react'

const formSchema = z.object({
  title: z.string().min(5, 'El título es muy corto'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  is_anonymous: z.boolean().default(false)
})

type FormData = z.infer<typeof formSchema>

export function SuggestionForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAuth()

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => membersService.getCurrentMember(session!.user.id),
    enabled: !!session?.user.id
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      is_anonymous: false
    }
  })

  const isAnonymous = watch('is_anonymous')

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!currentMember) throw new Error("No se ha podido cargar tu perfil.")
      return suggestionsService.createSuggestion({
        ...data,
        created_by: currentMember.id
      })
    },
    onSuccess: (savedSuggestion) => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      navigate(`/suggestions/${savedSuggestion.id}`)
    }
  })

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/suggestions')} className="text-zinc-400">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al buzón
      </Button>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl">Nueva Sugerencia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="title">Título de la sugerencia</Label>
              <Input 
                id="title" 
                {...register('title')} 
                className="bg-zinc-950 border-zinc-800 text-zinc-100 h-12" 
                placeholder="Ej: Comprar una barbacoa nueva" 
              />
              {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción detallada</Label>
              <textarea 
                id="description" 
                {...register('description')} 
                className="flex min-h-[150px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500" 
                placeholder="Explica tu idea, por qué crees que es buena, cuánto costaría..."
              />
              {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="space-y-0.5">
                <Label className="text-base font-medium text-zinc-200">Publicar de forma anónima</Label>
                <p className="text-xs text-zinc-500">Si lo activas, nadie sabrá que has sido tú.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isAnonymous}
                  onChange={(e) => setValue('is_anonymous', e.target.checked)}
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate('/suggestions')} className="text-zinc-400">
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="bg-purple-600 hover:bg-purple-700 h-10 px-6">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Publicar
              </Button>
            </div>
            
            {saveMutation.isError && (
              <p className="text-red-500 text-sm text-right mt-2">Error al publicar: {(saveMutation.error as Error).message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
