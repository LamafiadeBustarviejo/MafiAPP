import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suggestionsService } from '@/services/suggestions'
import { membersService } from '@/services/members'
import { useAuth } from '@/hooks/useAuth'
import { CommentBubble } from '@/features/tasks/CommentBubble'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Send, UserCircle2 } from 'lucide-react'

export function SuggestionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  
  const [newComment, setNewComment] = useState('')
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { data: suggestion, isLoading: isLoadingSuggestion } = useQuery({
    queryKey: ['suggestions', id],
    queryFn: () => suggestionsService.getSuggestion(id!)
  })

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => membersService.getCurrentMember(session!.user.id),
    enabled: !!session?.user.id
  })

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['suggestion-comments', id],
    queryFn: () => suggestionsService.getComments(id!)
  })

  // Mutations
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => {
      if (!currentMember) throw new Error("Miembro no encontrado")
      return suggestionsService.addComment({
        suggestion_id: id!,
        author_id: currentMember.id,
        content
      })
    },
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['suggestion-comments', id] })
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    }
  })

  const editCommentMutation = useMutation({
    mutationFn: ({ id, content }: { id: string, content: string }) => suggestionsService.updateComment(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suggestion-comments', id] })
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => suggestionsService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestion-comments', id] })
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    }
  })

  if (isLoadingSuggestion) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
  if (!suggestion) return <div className="p-4 text-center text-red-500">Error al cargar la sugerencia.</div>

  const isAdmin = currentMember?.role?.name === 'admin' || currentMember?.roles?.name === 'admin' || session?.user?.email === 'soyelcharly@gmail.com'

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/suggestions')} className="text-zinc-400">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* INFO DE LA SUGERENCIA (Columna izq) */}
        <div className="md:col-span-1 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader className="pb-3 border-b border-zinc-800/50">
              <CardTitle className="text-xl leading-tight text-white">{suggestion.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="flex items-center gap-2 mb-4">
                {suggestion.is_anonymous ? (
                  <span className="flex items-center text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800">
                    👤 Publicado de forma anónima
                  </span>
                ) : (
                  <span className="flex items-center text-zinc-200 bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-700">
                    <UserCircle2 className="w-5 h-5 mr-2 text-purple-400" />
                    Propuesto por {suggestion.creator?.nickname}
                  </span>
                )}
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{suggestion.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COMENTARIOS (Columna der) */}
        <div className="md:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800 flex flex-col h-[600px] shadow-xl">
            <CardHeader className="py-3 px-4 border-b border-zinc-800 flex-none bg-zinc-900/50">
              <CardTitle className="text-base font-medium flex items-center text-zinc-200">
                Debate y Comentarios
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-zinc-950/30">
              {isLoadingComments ? (
                <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
              ) : comments?.length === 0 ? (
                <div className="text-center text-zinc-500 text-sm mt-10">
                  <p>No hay comentarios aún.</p>
                  <p className="mt-1">Sé el primero en dar tu opinión sobre esta propuesta.</p>
                </div>
              ) : (
                comments?.map(comment => (
                  <CommentBubble 
                    key={comment.id}
                    comment={comment} 
                    isOwnComment={comment.author?.profile_id === session?.user.id}
                    isAdmin={isAdmin}
                    onEdit={(id, content) => editCommentMutation.mutate({ id, content })}
                    onDelete={(id) => {
                      if (window.confirm('¿Seguro que quieres borrar este comentario?')) {
                        deleteCommentMutation.mutate(id)
                      }
                    }}
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
                  placeholder="Escribe tu opinión..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-full px-4 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  disabled={addCommentMutation.isPending}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full bg-purple-700 hover:bg-purple-600 shrink-0"
                  disabled={!newComment.trim() || addCommentMutation.isPending || !currentMember}
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
