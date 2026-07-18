import { Badge } from '@/components/ui/badge'
import type { TaskStatus, TaskPriority } from '@/types'
import { AlertCircle, Clock, CheckCircle2, XCircle, Archive } from 'lucide-react'

const statusConfig: Record<TaskStatus, { label: string, colorClass: string, icon: any }> = {
  pending: { label: 'Pendiente', colorClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: Clock },
  in_progress: { label: 'En progreso', colorClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
  completed: { label: 'Completada', colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', colorClass: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
  archived: { label: 'Archivada', colorClass: 'bg-zinc-800 text-zinc-500 border-zinc-700', icon: Archive }
}

export function TaskStatusBadge({ status, className }: { status: TaskStatus, className?: string }) {
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon
  
  return (
    <Badge variant="outline" className={`font-medium gap-1 flex items-center ${config.colorClass} ${className || ''}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}

const priorityConfig: Record<TaskPriority, { label: string, colorClass: string }> = {
  low: { label: 'Baja', colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  medium: { label: 'Media', colorClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  high: { label: 'Alta', colorClass: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  urgent: { label: 'Urgente', colorClass: 'bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1' }
}

export function TaskPriorityBadge({ priority, className }: { priority: TaskPriority, className?: string }) {
  const config = priorityConfig[priority] || priorityConfig.medium
  
  return (
    <Badge variant="outline" className={`font-medium ${config.colorClass} ${className || ''}`}>
      {priority === 'urgent' && <AlertCircle className="w-3 h-3 animate-pulse" />}
      {config.label}
    </Badge>
  )
}
