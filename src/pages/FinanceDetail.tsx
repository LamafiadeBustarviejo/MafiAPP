import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financesService } from '@/services/finances'
import { membersService } from '@/services/members'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, ArrowUpRight, ArrowDownRight, Banknote, Calendar, Tag, FileText, User, Receipt, History, Ban } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function FinanceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', user?.id],
    queryFn: () => membersService.getCurrentMember(user!.id),
    enabled: !!user?.id
  })
  
  const { data: movement, isLoading } = useQuery({
    queryKey: ['finance', id],
    queryFn: () => financesService.getMovement(id!),
    enabled: !!id
  })
  
  const { data: history } = useQuery({
    queryKey: ['finance-history', id],
    queryFn: () => financesService.getMovementHistory(id!),
    enabled: !!id
  })

  const cancelMutation = useMutation({
    mutationFn: () => financesService.cancelMovement(id!, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', id] })
      queryClient.invalidateQueries({ queryKey: ['finance-history', id] })
      queryClient.invalidateQueries({ queryKey: ['finances'] })
      queryClient.invalidateQueries({ queryKey: ['member-balance'] })
    }
  })

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
  if (!movement) return <div className="p-12 text-center text-zinc-500">Movimiento no encontrado</div>

  const isIncome = movement.type === 'income' || movement.type === 'fee'
  const isFee = movement.type === 'fee'
  
  const isAdmin = currentMember?.role?.name === 'admin' || currentMember?.roles?.name === 'admin' || user?.email === 'soyelcharly@gmail.com'
  const canEdit = isAdmin || user?.id === movement.created_by

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de que quieres anular este movimiento? Quedará tachado y el importe no contabilizará, pero el registro se mantendrá.')) {
      cancelMutation.mutate()
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto pb-20">
      <Button 
        variant="ghost" 
        className="mb-6 text-zinc-400 hover:text-white"
        onClick={() => navigate('/finances')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Finanzas
      </Button>

      <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center shrink-0 ${
            isFee ? 'bg-indigo-950/50 text-indigo-500' :
            isIncome ? 'bg-emerald-950/50 text-emerald-500' : 
            'bg-red-950/50 text-red-500'
          }`}>
            {isFee ? <Banknote className="h-8 w-8" /> :
             isIncome ? <ArrowUpRight className="h-8 w-8" /> : 
             <ArrowDownRight className="h-8 w-8" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">{movement.concept}</h1>
            <div className="flex gap-2 items-center mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                isFee ? 'bg-indigo-950 text-indigo-400' :
                isIncome ? 'bg-emerald-950 text-emerald-400' : 
                'bg-red-950 text-red-400'
              }`}>
                {isFee ? 'Cuota' : isIncome ? 'Ingreso' : 'Gasto'}
              </span>
              {movement.status === 'cancelled' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-red-950 text-red-500 border border-red-500">
                  Anulado
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-left md:text-right w-full md:w-auto mt-4 md:mt-0 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Importe Total</div>
          <div className={`text-4xl font-bold ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>
            {isIncome ? '+' : '-'}{movement.amount.toFixed(2)} €
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BLOQUE DE INFORMACIÓN */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="border-b border-zinc-800/50">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText className="w-5 h-5 text-zinc-400" /> Detalles del Movimiento</span>
              <div className="flex gap-2">
                {canEdit && movement.status !== 'cancelled' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white" onClick={() => navigate(`/finances/${movement.id}/edit`)}>
                    Editar
                  </Button>
                )}
                {isAdmin && movement.status !== 'cancelled' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs border-red-900/50 bg-red-950/20 text-red-500 hover:bg-red-900/50 hover:text-red-400" onClick={handleCancel} disabled={cancelMutation.isPending}>
                    {cancelMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                    Anular
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-zinc-800/50">
              <li className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Calendar className="w-4 h-4" /> <span className="text-sm">Fecha Contable</span>
                </div>
                <span className="text-zinc-200 font-medium">{new Date(movement.date).toLocaleDateString()}</span>
              </li>
              <li className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Tag className="w-4 h-4" /> <span className="text-sm">Categoría</span>
                </div>
                <span className="text-zinc-200 font-medium capitalize">{movement.category}</span>
              </li>
              <li className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-400">
                  <User className="w-4 h-4" /> <span className="text-sm">Registrado por</span>
                </div>
                <span className="text-zinc-200 font-medium">{movement.creator?.nickname || '-'}</span>
              </li>
              {isFee ? (
                <li className="p-4 flex items-center justify-between bg-indigo-950/10">
                  <div className="flex items-center gap-3 text-indigo-400">
                    <User className="w-4 h-4" /> <span className="text-sm font-semibold">Miembro Asignado (Cuota)</span>
                  </div>
                  <span className="text-indigo-300 font-bold">{movement.member?.nickname || '-'}</span>
                </li>
              ) : (
                <li className="p-4 flex items-center justify-between border-t border-zinc-800/50">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <User className="w-4 h-4" /> <span className="text-sm font-semibold">
                      {movement.type === 'expense' ? 'Pagado por' : 'Cobrado por'}
                    </span>
                  </div>
                  <span className="text-blue-400 font-bold">
                    {movement.member?.nickname || 'Peña La Mafia'}
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* JUSTIFICANTES (TICKETS) */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="border-b border-zinc-800/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-zinc-400" /> Justificantes (Tickets)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {movement.attachments && movement.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {movement.attachments.map(att => (
                    <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 aspect-square">
                      <img src={att.file_url} alt="Ticket" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-medium text-white">
                        Ver Original
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 border-2 border-dashed border-zinc-800 rounded-lg text-zinc-500">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No se ha subido ningún ticket ni factura para este movimiento.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* HISTORIAL DE AUDITORÍA */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="border-b border-zinc-800/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-zinc-400" /> Historial de Cambios
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!history || history.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center">No hay modificaciones registradas.</p>
              ) : (
                <div className="space-y-4">
                  {history.map(record => (
                    <div key={record.id} className="text-sm border-l-2 border-zinc-700 pl-3">
                      <div className="flex justify-between text-zinc-400 mb-1">
                        <span className="font-semibold text-zinc-300">{record.action}</span>
                        <span className="text-xs">{new Date(record.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-zinc-500 text-xs">
                        Usuario: <span className="text-zinc-300">{record.profile?.email || record.performed_by}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
