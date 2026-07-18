import { Card, CardContent } from '@/components/ui/card'
import { TaskStatusBadge, TaskPriorityBadge } from './TaskBadges'
import type { Task } from '@/types'
import { CalendarIcon, MessageSquare, User2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate()
  
  // Check if overdue
  const isOverdue = task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'completed' && 
    task.status !== 'cancelled' && 
    task.status !== 'archived'

  const commentsCount = task.comments_count?.[0]?.count || 0

  return (
    <Card 
      className={`bg-zinc-900 transition-colors cursor-pointer active:scale-[0.98] rounded-none border-x-0 border-t-0 first:border-t ${
        isOverdue ? 'border-b-red-900/50 hover:bg-red-950/20' : 'border-b-zinc-800 hover:bg-zinc-800/50'
      }`}
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <div className="p-3 flex flex-col md:flex-row md:items-center gap-3">
        {/* Main Info */}
        <div className="flex-1 min-w-0 flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            <TaskStatusBadge status={task.status} className="scale-75 origin-top-left md:origin-center" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-100 truncate text-sm md:text-base leading-tight">
              {task.title}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <User2 className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{task.assignee?.nickname || 'Sin asignar'}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha'}
                </span>
              </div>
              <div className="flex items-center">
                <TaskPriorityBadge priority={task.priority} />
              </div>
              {commentsCount > 0 && (
                <div className="flex items-center gap-1 text-zinc-500">
                  <MessageSquare className="h-3 w-3" />
                  <span>{commentsCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </Card>
  )
}
