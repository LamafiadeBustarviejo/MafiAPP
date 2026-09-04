import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { membersService } from '@/services/members'
import { financesService } from '@/services/finances'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckSquare, DollarSign, Loader2, ArrowRight, Package, Plus, CheckCircle2, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { calendarService } from '@/services/calendar'
import { AgendaList } from '@/features/agenda/AgendaList'
import { PollWidget } from '@/features/polls/PollWidget'

export function Dashboard() {
  const { user } = useAuth()
  
  // 1. Fetch current member
  const { data: member, isLoading: isLoadingMember } = useQuery({
    queryKey: ['currentMember', user?.id],
    queryFn: () => membersService.getCurrentMember(user!.id),
    enabled: !!user
  })
  
  // 2. Fetch tasks assigned to current member
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['memberTasks', member?.id],
    queryFn: () => membersService.getMemberTasks(member!.id, member!.nickname),
    enabled: !!member
  })
  
  // 3. Fetch fee status for current member
  const { data: feePayment, isLoading: isLoadingFee } = useQuery({
    queryKey: ['memberFee', member?.id],
    queryFn: () => financesService.getMemberFeeStatus(member!.id),
    enabled: !!member
  })

  // 4. Fetch balance (tesorería)
  const { data: balance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['member-balance', member?.id],
    queryFn: () => financesService.getMemberBalance(member!.id),
    enabled: !!member
  })

  // 5. Fetch member expenses
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['memberExpenses', member?.id],
    queryFn: () => financesService.getMemberExpenses(member!.id),
    enabled: !!member
  })

  // 6. Fetch upcoming events
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['agenda'],
    queryFn: calendarService.getUpcomingEvents,
    refetchInterval: 60000 * 5 // 5 min
  })

  if (isLoadingMember) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
  }

  if (!member) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mi Situación</h1>
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-red-400 font-semibold text-lg">Perfil de miembro no encontrado</h2>
          <p className="text-zinc-400 text-sm mt-1">Contacta con el administrador para que asigne tu cuenta a un perfil de miembro.</p>
        </div>
      </div>
    )
  }

  const isLoading = isLoadingTasks || isLoadingFee || isLoadingBalance

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mi Situación</h1>
          <div className="text-zinc-400 flex items-center gap-2">
            Resumen personal de {member.nickname}
            {feePayment && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" title="Cuota pagada" />
            )}
          </div>
          {tasks?.length === 0 && (
             <p className="text-emerald-400 text-sm mt-1">¡Gracias! Hiciste todas las tareas.</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-emerald-500/50 transition-colors">
            <Link to="/tasks/new" className="flex items-center">
              <CheckSquare className="w-4 h-4 mr-1.5 text-emerald-400" />
              Nueva tarea
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-orange-500/50 transition-colors">
            <Link to="/finances/new" className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1.5 text-orange-400" />
              Nuevo mov.
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-blue-500/50 transition-colors">
            <Link to="/inventory/new" className="flex items-center">
              <Package className="w-4 h-4 mr-1.5 text-blue-400" />
              Nuevo artículo
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CUOTA (Solo si está pendiente) */}
          {!feePayment && (
            <Card className="border bg-red-950/20 border-red-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-zinc-200 flex justify-between items-center">
                  Estado de la Cuota
                  <DollarSign className="w-5 h-5 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="text-2xl font-bold text-red-400 mb-2">Pendiente</div>
                  <p className="text-sm text-red-400/80">Aún no consta tu pago de la cuota anual (60€).</p>
                  <div className="mt-6">
                    <Link to="/finances/new">
                      <Button size="sm" variant="outline" className="w-full border-red-900/50 text-red-400 hover:bg-red-950 hover:text-red-300">
                        Registrar Pago <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TESORERIA */}
          {(balance || 0) > 0 && (
            <Card className="border bg-orange-950/20 border-orange-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-zinc-200 flex justify-between items-center">
                  Tesorería (Saldo con la peña)
                  <DollarSign className="w-5 h-5 text-orange-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="text-2xl font-bold text-orange-500 mb-4">
                    La Mafia te debe {(balance || 0).toFixed(2)} €
                  </div>
                  <Link to={`/finances/new?type=compensation&amount=${balance}&member_id=${member.id}`}>
                    <Button size="sm" variant="outline" className="w-full border-orange-900/50 text-orange-400 hover:bg-orange-950 hover:text-orange-300">
                      Marcar como pagado por la Mafia <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Widget de Encuestas */}
          <PollWidget />

          {/* TAREAS (Solo si tiene tareas pendientes) */}
          {tasks && tasks.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-zinc-200 flex justify-between items-center">
                  Mis Tareas Pendientes
                  <CheckSquare className="w-5 h-5 text-indigo-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map(task => (
                    <div key={task.id} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                      <div className="font-medium text-zinc-200">{task.title}</div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-sm text-zinc-500">
                          Estado: <span className="text-indigo-400">{task.status}</span>
                        </div>
                        <Link to={`/tasks/${task.id}`}>
                          <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white h-8">
                            Ver <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* AGENDA OFICIAL */}
      <div className="mt-12 pt-12 border-t border-zinc-800">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-red-500" />
          Agenda Oficial
        </h2>
        {isLoadingEvents ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
        ) : events && events.length > 0 ? (
          <AgendaList events={events} />
        ) : (
          <div className="text-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
            No hay próximos eventos programados.
          </div>
        )}
      </div>
    </div>
  )
}
