import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksService } from '@/services/tasks'
import { membersService } from '@/services/members'
import { useAuth } from '@/hooks/useAuth'
import { TaskStatusBadge, TaskPriorityBadge } from '@/features/tasks/TaskBadges'
import { CommentBubble } from '@/features/tasks/CommentBubble'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Edit2, CalendarClock, Send, User2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { TaskStatus } from '@/types'

export function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  
  const [newComment, setNewComment] = useState('')
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksService.getTask(id!)
  })

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => membersService.getCurrentMember(session!.user.id),
    enabled: !!session?.user.id
  })

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['task-comments', id],
    queryFn: () => tasksService.getComments(id!)
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: TaskStatus) => tasksService.updateTask(id!, { status: newStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', id] })
  })

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => tasksService.addComment({
      task_id: id!,
      author_id: session!.user.id,
      content
    }),
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['task-comments', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] }) // Update comments count
    }
  })

  const editCommentMutation = useMutation({
    mutationFn: ({ id, content }: { id: string, content: string }) => tasksService.updateComment(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-comments', id] })
  })

  // Auto-scroll comments removido para que no baje del todo
  // useEffect(() => {
  //   commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }, [comments])

  if (isLoadingTask) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
  if (!task) return <div className="p-4 text-center text-red-500">Error al cargar la tarea.</div>

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !['completed', 'cancelled', 'archived'].includes(task.status)
  
  const isAdmin = currentMember?.role?.name === 'admin' || currentMember?.roles?.name === 'admin' || session?.user?.email === 'soyelcharly@gmail.com'
  const canEdit = session?.user.id === task.created_by || session?.user.id === task.assignee?.profile_id || isAdmin

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="text-zinc-400">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        {canEdit && (
          <Button size="sm" variant="secondary" onClick={() => navigate(`/tasks/${id}/edit`)}>
            <Edit2 className="w-4 h-4 mr-2" /> Editar Tarea
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* INFO Y ACCIONES (Columna izq) */}
        <div className="md:col-span-1 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3 border-b border-zinc-800/50">
              <div className="flex justify-between items-start mb-2">
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
              </div>
              <CardTitle className="text-xl leading-tight">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-zinc-400">
                  <User2 className="w-4 h-4 mr-1.5" /> Responsable
                </div>
                <div className="font-medium text-zinc-100">{task.assignee?.nickname || 'Sin asignar'}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-zinc-400">
                  <CalendarClock className="w-4 h-4 mr-1.5" /> Vencimiento
                </div>
                <div className={`font-medium ${isOverdue ? 'text-red-400 flex items-center gap-1' : 'text-zinc-100'}`}>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha'}
                  {isOverdue && <AlertTriangle className="w-4 h-4" />}
                </div>
              </div>

              {task.description && (
                <div className="pt-4 border-t border-zinc-800/50 space-y-1">
                  <div className="text-zinc-400 mb-1">Descripción</div>
                  <p className="text-zinc-300 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          {canEdit && task.status !== 'completed' && task.status !== 'archived' && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="text-sm text-zinc-400 mb-2 font-medium">Acciones Rápidas</div>
                {task.status === 'pending' && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-500" 
                    onClick={() => updateStatusMutation.mutate('in_progress')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Marcar En Progreso
                  </Button>
                )}
                {task.status === 'in_progress' && (
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-500" 
                    onClick={() => updateStatusMutation.mutate('completed')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Completar Tarea
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* COMENTARIOS (Columna der) */}
        <div className="md:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800 flex flex-col h-[600px]">
            <CardHeader className="py-3 px-4 border-b border-zinc-800 flex-none bg-zinc-900/50">
              <CardTitle className="text-base font-medium flex items-center text-zinc-200">
                Comentarios
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-zinc-950/30">
              {isLoadingComments ? (
                <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
              ) : comments?.length === 0 ? (
                <div className="text-center text-zinc-500 text-sm mt-10">No hay comentarios aún.</div>
              ) : (
                comments?.map(comment => (
                  <CommentBubble 
                    key={comment.id}
                    comment={comment} 
                    isOwnComment={comment.author?.profile_id === session?.user.id}
                    onEdit={(id, content) => editCommentMutation.mutate({ id, content })}
                  />
                ))
              )}
              <div ref={commentsEndRef} />
            </CardContent>
            <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex-none">
              <form 
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newComment.trim()) addCommentMutation.mutate(newComment)
                }}
              >
                <input
                  type="text"
                  placeholder="Escribe un comentario..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-full px-4 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  disabled={addCommentMutation.isPending}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full bg-red-800 hover:bg-red-700 shrink-0"
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
