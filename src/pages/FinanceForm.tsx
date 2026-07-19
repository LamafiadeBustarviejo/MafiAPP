import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financesService } from '@/services/finances'
import { membersService } from '@/services/members'
import { useAuth } from '@/hooks/useAuth'
import { EVENTS } from '@/lib/constants'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Receipt, Euro, ArrowLeft, Image as ImageIcon } from 'lucide-react'

const financeSchema = z.object({
  type: z.enum(['income', 'expense', 'fee']),
  amount: z.number().min(0.01, 'El importe debe ser mayor que 0'),
  concept: z.string().min(3, 'El concepto es muy corto'),
  category: z.string().min(1, 'La categoría es obligatoria'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  member_id: z.string().optional(),
  event: z.string().nullish(),
}).refine(data => {
  if (data.type === 'fee' && !data.member_id) return false
  return true
}, {
  message: "Debes seleccionar a qué miembro corresponde la cuota",
  path: ["member_id"]
})

type FinanceFormData = z.infer<typeof financeSchema>

const CATEGORIES = [
  'Comida', 'Bebida', 'Local', 
  'Electricidad', 'Música', 'Material', 'Transporte', 
  'Limpieza', 'Cuotas', 'Otros'
]

export function FinanceForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isEditing = !!id
  
  const [file, setFile] = useState<File | null>(null)
  
  const [paidByMode, setPaidByMode] = useState<'peña' | 'me' | 'other'>('peña')
  const [otherMemberId, setOtherMemberId] = useState<string>('')
  
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['members'],
    queryFn: membersService.getMembers
  })
  
  const { data: movement, isLoading: loadingMovement } = useQuery({
    queryKey: ['finance', id],
    queryFn: () => financesService.getMovement(id!),
    enabled: isEditing
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FinanceFormData>({
    resolver: zodResolver(financeSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      concept: '',
      category: 'Otros',
      date: new Date().toISOString().split('T')[0]
    }
  })
  
  const selectedType = watch('type')

  useEffect(() => {
    if (movement) {
      reset({
        type: movement.type,
        amount: movement.amount,
        concept: movement.concept,
        category: movement?.category || CATEGORIES[0],
        date: movement ? new Date(movement.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        member_id: movement?.member_id || undefined,
        event: movement?.event || ''
      })
      
      if (movement.type === 'expense' || movement.type === 'income') {
        if (!movement.member_id) {
          setPaidByMode('peña')
        } else if (members?.find(m => m.profile_id === user?.id)?.id === movement.member_id) {
          setPaidByMode('me')
        } else {
          setPaidByMode('other')
          setOtherMemberId(movement.member_id)
        }
      }
    }
  }, [movement, reset, members, user?.id])

  // Al seleccionar cuota, poner 60 euros por defecto (si no es edición)
  useEffect(() => {
    if (!isEditing && selectedType === 'fee') {
      setValue('amount', 60)
      setValue('category', 'Cuotas')
      setValue('concept', 'Cuota de la Peña')
    } else if (!isEditing) {
      setValue('amount', 0)
    }
  }, [selectedType, isEditing, setValue])

  const saveMutation = useMutation({
    mutationFn: async (data: FinanceFormData) => {
      let savedMovement
      
      const currentMember = members?.find(m => m.profile_id === user?.id)
      
      let finalMemberId = null
      if (data.type === 'fee') {
        finalMemberId = data.member_id
      } else if (data.type === 'expense' || data.type === 'income') {
        if (paidByMode === 'me') finalMemberId = currentMember?.id || null
        else if (paidByMode === 'other') {
          if (!otherMemberId) throw new Error("Por favor, selecciona qué miembro ha pagado el movimiento en el desplegable.")
          finalMemberId = otherMemberId
        }
      }

      const payload = {
        ...data,
        member_id: finalMemberId,
        event: data.event || null
      }
      
      if (!isEditing && !currentMember) throw new Error("No se ha podido cargar tu perfil de peñista.")

      if (isEditing) {
        savedMovement = await financesService.updateMovement(id!, payload)
      } else {
        savedMovement = await financesService.createMovement({
          ...payload,
          created_by: currentMember!.id,
          status: 'completed'
        })
      }
      
      if (file && savedMovement) {
        await financesService.uploadAttachment(savedMovement.id, file, currentMember!.id)
      }
      
      return savedMovement
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['finances'] })
      queryClient.invalidateQueries({ queryKey: ['finance', id] })
      queryClient.invalidateQueries({ queryKey: ['member-balance'] })
      navigate(isEditing ? `/finances/${data.id}` : '/finances')
    }
  })

  if (isEditing && loadingMovement) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-zinc-500" /></div>
  
  const currentMemberInfo = members?.find(m => m.profile_id === user?.id)
  const isAdmin = currentMemberInfo?.role?.name === 'admin' || currentMemberInfo?.roles?.name === 'admin' || user?.email === 'soyelcharly@gmail.com'
  const canEditAmount = !isEditing || isAdmin

  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      <Button variant="ghost" className="mb-6 text-zinc-400" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader className="border-b border-zinc-800/50 pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Receipt className="w-6 h-6 text-emerald-500" />
            {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento Financiero'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {saveMutation.isError && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-900 rounded-lg text-red-400 text-sm flex items-start gap-3">
              <div className="mt-0.5">⚠️</div>
              <div>{(saveMutation.error as Error).message}</div>
            </div>
          )}
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Tipo de Operación</label>
                <Select 
                  value={selectedType} 
                  onValueChange={(v: 'income'|'expense'|'fee') => setValue('type', v)}
                  disabled={!canEditAmount}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-zinc-100">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="income">Ingreso</SelectItem>
                    <SelectItem value="fee">Cuota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Importe</label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input 
                    type="number" 
                    step="0.01"
                    className="pl-10 bg-zinc-950 border-zinc-800 h-12 text-lg font-bold text-zinc-100"
                    disabled={!canEditAmount}
                    {...register('amount', { valueAsNumber: true })}
                  />
                </div>
                {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
                {isEditing && !isAdmin && <p className="text-zinc-500 text-xs mt-1">Solo los administradores pueden modificar el importe de un movimiento existente por seguridad.</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Concepto / Descripción</label>
              <Input 
                className="bg-zinc-950 border-zinc-800 h-12 text-zinc-100"
                placeholder="Ej. Compra de bebida Mercadona"
                {...register('concept')}
              />
              {errors.concept && <p className="text-red-500 text-xs">{errors.concept.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Categoría</label>
                <Select 
                  value={watch('category')} 
                  onValueChange={(v) => setValue('category', v)}
                  disabled={selectedType === 'fee'}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-zinc-100">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Fecha</label>
                <Input 
                  type="date"
                  className="bg-zinc-950 border-zinc-800 h-12 text-zinc-100 [color-scheme:dark]"
                  {...register('date')}
                />
                {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Relacionado con (Evento)</label>
              <Select 
                value={watch('event') || ''} 
                onValueChange={(v) => setValue('event', v)}
              >
                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12">
                  <SelectValue placeholder="Ninguno / General" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="">Ninguno / General</SelectItem>
                  {EVENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {(selectedType === 'expense' || selectedType === 'income') && (
              <div className="space-y-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <label className="text-sm font-medium text-zinc-200">
                  {selectedType === 'expense' ? 'Pagado por' : 'Cobrado por'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaidByMode('me')}
                    className={`p-2 text-sm rounded-md border ${paidByMode === 'me' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'}`}
                  >
                    Yo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidByMode('peña')}
                    className={`p-2 text-sm rounded-md border ${paidByMode === 'peña' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'}`}
                  >
                    Peña La Mafia
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidByMode('other')}
                    className={`p-2 text-sm rounded-md border ${paidByMode === 'other' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'}`}
                  >
                    Otro...
                  </button>
                </div>
                
                {paidByMode === 'other' && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                    <Select 
                      value={otherMemberId} 
                      onValueChange={setOtherMemberId}
                    >
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12">
                        <SelectValue placeholder="Selecciona el miembro..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-64">
                        {members?.map(m => <SelectItem key={m.id} value={m.id}>{m.nickname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {selectedType === 'fee' && (
              <div className="space-y-2 p-4 bg-indigo-950/20 border border-indigo-900/50 rounded-xl">
                <label className="text-sm font-medium text-indigo-400">Miembro que paga la cuota</label>
                {loadingMembers ? (
                  <div className="h-12 flex items-center justify-center bg-zinc-950 rounded-md border border-zinc-800"><Loader2 className="w-5 h-5 animate-spin" /></div>
                ) : (
                  <Select 
                    value={watch('member_id')} 
                    onValueChange={(v) => setValue('member_id', v)}
                  >
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12">
                      <SelectValue placeholder="Selecciona el miembro..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-64">
                      {members?.map(m => <SelectItem key={m.id} value={m.id}>{m.nickname}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {errors.member_id && <p className="text-red-500 text-xs">{errors.member_id.message}</p>}
              </div>
            )}
            
            {!isEditing && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Adjuntar Justificante (Opcional)</label>
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-950/20' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <>
                        <ImageIcon className="w-8 h-8 mb-2 text-emerald-500" />
                        <p className="text-sm text-emerald-400 font-medium">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mb-2 text-zinc-500" />
                        <p className="text-sm text-zinc-400">Haz clic para subir un ticket o foto</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            )}

            <div className="pt-6 border-t border-zinc-800/50">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {isEditing ? 'Guardar Cambios' : 'Registrar Movimiento'}
              </Button>
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
