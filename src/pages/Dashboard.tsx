import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { membersService } from '@/services/members'
import { financesService } from '@/services/finances'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckSquare, DollarSign, Loader2, ArrowRight, Package, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

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
    queryFn: () => membersService.getMemberTasks(member!.id),
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
          <p className="text-zinc-400">Resumen personal de {member.nickname}.</p>
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
          
          {/* CUOTA */}
          <Card className={`border ${feePayment ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-zinc-200 flex justify-between items-center">
                Estado de la Cuota
                <DollarSign className={`w-5 h-5 ${feePayment ? 'text-emerald-500' : 'text-red-500'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feePayment ? (
                <div>
                  <div className="text-2xl font-bold text-emerald-400 mb-2">¡Pagada!</div>
                  <p className="text-sm text-emerald-500/80">Estás al corriente de pago.</p>
                  <p className="text-xs text-zinc-500 mt-4">Último registro: {new Date(feePayment.date).toLocaleDateString()}</p>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>

          {/* TESORERIA */}
          <Card className={`border ${(balance || 0) > 0 ? 'bg-orange-950/20 border-orange-900/50' : 'bg-zinc-900 border-zinc-800'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-zinc-200 flex justify-between items-center">
                Tesorería (Saldo con la peña)
                <DollarSign className={`w-5 h-5 ${(balance || 0) > 0 ? 'text-orange-500' : 'text-zinc-500'}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-sm font-medium text-zinc-400 mb-1">
                  {(balance || 0) > 0 ? 'La peña te debe:' : 'Cuentas al día'}
                </div>
                <div className={`text-2xl font-bold ${(balance || 0) > 0 ? 'text-orange-500' : 'text-zinc-500'}`}>
                  {(balance || 0).toFixed(2)} €
                </div>
                {(balance || 0) > 0 && (
                  <p className="text-xs text-orange-400/80 mt-2">
                    Has adelantado dinero de tu bolsillo que la peña te tiene que devolver.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* TAREAS */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-zinc-200 flex justify-between items-center">
                Mis Tareas Pendientes
                <CheckSquare className="w-5 h-5 text-indigo-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!tasks || tasks.length === 0 ? (
                <div className="py-6 text-center text-zinc-500">
                  <CheckSquare className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                  <p className="text-sm">No tienes ninguna tarea asignada.</p>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  <div className="text-sm text-indigo-400 font-medium mb-4">Tienes {tasks.length} tarea(s) pendiente(s)</div>
                  {tasks.map(task => (
                    <Link key={task.id} to={`/tasks/${task.id}`}>
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors group cursor-pointer flex justify-between items-center">
                        <div className="truncate pr-4">
                          <h3 className="font-medium text-zinc-100 truncate text-sm group-hover:text-indigo-400 transition-colors">{task.title}</h3>
                          {task.due_date && (
                            <p className="text-xs text-zinc-500 mt-1">Límite: {new Date(task.due_date).toLocaleDateString()}</p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 shrink-0" />
                      </div>
                    </Link>
                  ))}
                  <div className="pt-2">
                    <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      Ver todo el panel de tareas &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
