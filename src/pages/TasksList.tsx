import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tasksService } from '@/services/tasks'
import { TaskCard } from '@/features/tasks/TaskCard'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Search, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { TaskStatus, TaskPriority } from '@/types'

export function TasksList() {
  const navigate = useNavigate()
  const { session } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('mine')
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksService.getTasks
  })

  // Filter tasks
  const filteredTasks = tasks?.filter(task => {
    // Mode filter
    if (filterMode === 'mine' && session?.user && task.assignee?.profile_id !== session.user.id) return false
    // Text search
    if (debouncedSearch && !task.title.toLowerCase().includes(debouncedSearch.toLowerCase()) && !task.assignee?.nickname.toLowerCase().includes(debouncedSearch.toLowerCase())) return false
    
    return true
  })

  if (error) {
    return <div className="p-4 text-center text-red-500">Error al cargar tareas: {(error as Error).message}</div>
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Tareas</h1>
          <p className="text-sm text-zinc-400">Organiza el trabajo de la peña.</p>
        </div>
        <Button onClick={() => navigate('/tasks/new')} className="w-full sm:w-auto bg-red-800 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Tabs / Search */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
          <button 
            className={`py-2 text-sm font-medium rounded-md transition-colors ${filterMode === 'mine' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
            onClick={() => setFilterMode('mine')}
          >
            Mis Tareas
          </button>
          <button 
            className={`py-2 text-sm font-medium rounded-md transition-colors ${filterMode === 'all' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
            onClick={() => setFilterMode('all')}
          >
            Todas
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por título o responsable..." 
            className="pl-9 bg-zinc-900/50 border-zinc-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
      ) : filteredTasks?.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
          No se encontraron tareas con estos filtros.
        </div>
      ) : (
        <div className="space-y-0 rounded-xl overflow-hidden border border-zinc-800/50">
          {filteredTasks?.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
