import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financesService } from '@/services/finances'
import { tasksService } from '@/services/tasks'
import { EVENTS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Euro, CheckSquare, Loader2, Wine, Utensils, Apple } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TaskStatusBadge } from '@/features/tasks/TaskBadges'

// Solo mostramos los 3 principales
const MAIN_EVENTS = EVENTS.filter(e => e !== 'Otro')

export function Events() {
  const { data: movements, isLoading: loadingFinances } = useQuery({
    queryKey: ['finances'],
    queryFn: financesService.getMovements
  })

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksService.getTasks
  })

  const [activeTab, setActiveTab] = useState<string | null>(null)

  if (loadingFinances || loadingTasks) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
  }

  const getEventIcon = (name: string, className = "w-5 h-5") => {
    if (name === 'Zurra') return <Wine className={className} />
    if (name === 'Comida de Peña') return <Utensils className={className} />
    if (name === 'Sidras asturianas') return <Apple className={className} />
    return null
  }

  // Ordenar eventos: los completados 100% van al final
  const sortedEvents = [...MAIN_EVENTS].sort((a, b) => {
    const tasksA = tasks?.filter(t => t.event === a) || []
    const tasksB = tasks?.filter(t => t.event === b) || []
    
    const isCompletedA = tasksA.length > 0 && tasksA.every(t => t.status === 'completed')
    const isCompletedB = tasksB.length > 0 && tasksB.every(t => t.status === 'completed')
    
    if (isCompletedA && !isCompletedB) return 1
    if (!isCompletedA && isCompletedB) return -1
    return 0
  })

  const currentTab = activeTab || sortedEvents[0]
  const currentEvent = sortedEvents.find(e => e === currentTab) || sortedEvents[0]

  // Datos del evento seleccionado
  const eventExpenses = movements?.filter(m => m.event === currentEvent && m.type === 'expense') || []
  const totalCost = eventExpenses.reduce((acc, curr) => acc + curr.amount, 0)

  const eventTasks = tasks?.filter(t => t.event === currentEvent) || []
  const pendingTasks = eventTasks.filter(t => ['pending', 'in_progress'].includes(t.status))
  const completedTasks = eventTasks.filter(t => ['completed'].includes(t.status))

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Nuestros eventos</h1>
        <p className="text-zinc-400">Control de gastos y tareas para los eventos transversales de la peña.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {sortedEvents.map(eventName => {
          const isSelected = eventName === currentEvent
          const eventT = tasks?.filter(t => t.event === eventName) || []
          const isCompleted = eventT.length > 0 && eventT.every(t => t.status === 'completed')

          return (
            <button
              key={eventName}
              onClick={() => setActiveTab(eventName)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors border ${
                isSelected 
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100' 
                  : isCompleted
                    ? 'bg-zinc-900/50 text-zinc-500 border-zinc-800'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {getEventIcon(eventName, "w-4 h-4")}
              <span className="font-medium text-sm">{eventName}</span>
              {isCompleted && <CheckSquare className="w-4 h-4 ml-1 opacity-50" />}
            </button>
          )
        })}
      </div>

      {/* Contenido del evento seleccionado */}
      <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
        <CardHeader className="border-b border-zinc-800/50 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
            {getEventIcon(currentEvent, "w-6 h-6 text-red-500")}
            {currentEvent}
          </CardTitle>
          <div className="flex items-center gap-2 bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-900/30">
            <span className="text-xs text-zinc-400 font-medium">Coste:</span>
            <span className="text-base font-bold text-red-500">{totalCost.toFixed(2)} €</span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 flex-1 flex flex-col gap-6">

          {/* Tareas */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-zinc-400" />
                Tareas ({pendingTasks.length} pendientes)
              </h4>
            </div>
            
            {/* Barra de progreso */}
            {eventTasks.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Progreso</span>
                  <span>{Math.round((completedTasks.length / eventTasks.length) * 100)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${(completedTasks.length / eventTasks.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {eventTasks.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No hay tareas asignadas a este evento.</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map(task => (
                  <Link 
                    key={task.id} 
                    to={`/tasks/${task.id}`}
                    className="block p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-medium text-sm text-zinc-200 line-clamp-1">{task.title}</span>
                      <TaskStatusBadge status={task.status} />
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-500">
                      <span>{task.assignee?.nickname || 'Sin asignar'}</span>
                    </div>
                  </Link>
                ))}
                
                {completedTasks.length > 0 && (
                  <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                    + {completedTasks.length} completadas
                  </p>
                )}
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
