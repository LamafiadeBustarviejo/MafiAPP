import { useState, useEffect } from 'react'
import type { CalendarEvent } from '@/services/calendar'
import { Calendar, MapPin, Clock, Music, Wine, PartyPopper, Image as ImageIcon, MessageCircle, Send, User, ChevronDown, ChevronUp } from 'lucide-react'
import { agendaCommentsService } from '@/services/agendaComments'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

interface AgendaListProps {
  events: CalendarEvent[]
}

export function AgendaList({ events }: AgendaListProps) {
  const [now, setNow] = useState(new Date())

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const isPast = (endStr?: string) => {
    if (!endStr) return false
    return new Date(endStr) < now
  }

  const isCurrent = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return false
    const start = new Date(startStr)
    const end = new Date(endStr)
    return now >= start && now <= end
  }

  const getEventIcon = (summary: string) => {
    const s = summary.toLowerCase();
    if (s.includes('charanga') || s.includes('música') || s.includes('concierto') || s.includes('dj')) return <Music className="w-5 h-5" />
    if (s.includes('vermut') || s.includes('cañas') || s.includes('comida') || s.includes('cena')) return <Wine className="w-5 h-5" />
    return <PartyPopper className="w-5 h-5" />
  }

  const pastEvents = events.filter(e => {
    const endStr = e.end.dateTime || e.end.date
    return isPast(endStr)
  })

  const upcomingEvents = events.filter(e => {
    const endStr = e.end.dateTime || e.end.date
    return !isPast(endStr)
  })

  // Agrupar eventos por día
  const groupEvents = (list: CalendarEvent[]) => list.reduce((acc, event) => {
    const startDate = event.start.dateTime || event.start.date
    if (!startDate) return acc
    const dateObj = new Date(startDate)
    const dateKey = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  const groupedUpcoming = groupEvents(upcomingEvents)
  const groupedPast = groupEvents(pastEvents)

  const [showPast, setShowPast] = useState(false)

  return (
    <div className="space-y-10">
      {Object.entries(groupedUpcoming).length === 0 && (
        <div className="text-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
          No hay eventos futuros programados.
        </div>
      )}

      {Object.entries(groupedUpcoming).map(([dateLabel, dayEvents]) => (
        <div key={dateLabel} className="space-y-6">
          <h2 className="sticky top-20 z-40 bg-black/90 backdrop-blur py-2 text-sm font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-900">
            {dateLabel}
          </h2>
          
          <div className="space-y-4 relative">
            <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-zinc-800 via-zinc-800 to-transparent" />
            
            {dayEvents.map((event) => {
              const startDate = event.start.dateTime || event.start.date
              const endDate = event.end.dateTime || event.end.date
              const past = isPast(endDate)
              const current = isCurrent(startDate, endDate)
              const isAllDay = !event.start.dateTime

              // Extraer enlace a imagen adjunta si la hay
              const firstAttachment = event.attachments && event.attachments.length > 0 ? event.attachments[0] : null;

              return <EventCard key={event.id} event={event} now={now} />
            })}
          </div>
        </div>
      ))}

      {pastEvents.length > 0 && (
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <Button 
            variant="ghost" 
            className="w-full flex justify-between items-center text-zinc-400 hover:text-white"
            onClick={() => setShowPast(!showPast)}
          >
            <span className="font-bold uppercase tracking-widest text-sm">Eventos Pasados ({pastEvents.length})</span>
            {showPast ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>

          {showPast && (
            <div className="mt-8 space-y-10 opacity-70">
              {Object.entries(groupedPast).map(([dateLabel, dayEvents]) => (
                <div key={dateLabel} className="space-y-6">
                  <h2 className="sticky top-20 z-40 bg-black/90 backdrop-blur py-2 text-sm font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-900">
                    {dateLabel}
                  </h2>
                  <div className="space-y-4 relative">
                    <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-zinc-800 via-zinc-800 to-transparent" />
                    {dayEvents.map(event => <EventCard key={event.id} event={event} now={now} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, now }: { event: CalendarEvent, now: Date }) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [guestName, setGuestName] = useState('')
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', event.id],
    queryFn: async () => {
      const res = await agendaCommentsService.getCommentsByEventIds([event.id])
      return res[event.id] || []
    },
    enabled: showComments
  })

  const addComment = useMutation({
    mutationFn: async () => {
      const author = session?.user?.user_metadata?.nickname || guestName || 'Anónimo'
      await agendaCommentsService.createComment(event.id, author, newComment)
    },
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['comments', event.id] })
    }
  })

  const startDate = event.start.dateTime || event.start.date
  const endDate = event.end.dateTime || event.end.date
  const isPastEvent = endDate ? new Date(endDate) < now : false
  const isCurrentEvent = startDate && endDate ? (new Date(startDate) <= now && new Date(endDate) >= now) : false
  const isAllDay = !event.start.dateTime

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const getEventIcon = (summary: string) => {
    const s = summary.toLowerCase();
    if (s.includes('charanga') || s.includes('música') || s.includes('concierto') || s.includes('dj')) return <Music className="w-5 h-5" />
    if (s.includes('vermut') || s.includes('cañas') || s.includes('comida') || s.includes('cena')) return <Wine className="w-5 h-5" />
    return <PartyPopper className="w-5 h-5" />
  }

  const firstAttachment = event.attachments && event.attachments.length > 0 ? event.attachments[0] : null;

  return (
    <div className={`relative flex gap-4 transition-all duration-500 ${isPastEvent ? 'grayscale' : 'hover:-translate-y-1'}`}>
      <div className="relative z-10 flex flex-col items-center shrink-0 mt-1">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] border-black shadow-xl ${isCurrentEvent ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white animate-pulse' : isPastEvent ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-800 text-zinc-300'}`}>
          {getEventIcon(event.summary)}
        </div>
      </div>
      
      <div className={`flex-1 rounded-3xl p-5 border shadow-2xl backdrop-blur-sm ${isCurrentEvent ? 'bg-red-950/20 border-red-900/50' : 'bg-zinc-900/40 border-zinc-800/50'}`}>
        <div className="flex justify-between items-start gap-4 mb-3">
          {firstAttachment ? (
            <a href={firstAttachment.fileUrl} target="_blank" rel="noopener noreferrer" className={`text-lg font-bold leading-tight flex items-center gap-2 hover:underline hover:text-emerald-400 transition-colors ${isCurrentEvent ? 'text-red-400' : 'text-zinc-100'}`}>
              {event.summary}
              <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            </a>
          ) : (
            <h3 className={`text-lg font-bold leading-tight ${isCurrentEvent ? 'text-red-400' : 'text-zinc-100'}`}>
              {event.summary}
            </h3>
          )}
          
          {isCurrentEvent && (
            <span className="text-[9px] font-black uppercase tracking-widest text-white bg-red-500 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] shrink-0">
              Ahora
            </span>
          )}
        </div>
        
        <div className="space-y-2 mt-3">
          {!isAllDay && (
            <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
              <Clock className="w-4 h-4 shrink-0 text-zinc-500" />
              <span>{formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-start gap-2 text-sm text-zinc-400">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" />
              <span className="leading-snug">{event.location}</span>
            </div>
          )}
        </div>
        
        {event.description && (
          <p className="mt-4 text-sm text-zinc-500 leading-relaxed border-t border-zinc-800/50 pt-4 font-medium">
            {event.description}
          </p>
        )}

        {/* Comments Toggle */}
        <div className="mt-4 pt-4 border-t border-zinc-800/50">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-400 hover:text-white px-2 py-1 h-auto"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {showComments ? 'Ocultar comentarios' : 'Ver comentarios'}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
            {isLoading ? (
              <div className="text-zinc-500 text-sm text-center py-2">Cargando comentarios...</div>
            ) : comments?.length === 0 ? (
              <div className="text-zinc-500 text-sm text-center py-2 bg-zinc-950/50 rounded-lg">Sé el primero en comentar</div>
            ) : (
              <div className="space-y-3">
                {comments?.map(comment => (
                  <div key={comment.id} className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-red-500" />
                      <span className="text-xs font-bold text-zinc-300">{comment.author_name}</span>
                      <span className="text-[10px] text-zinc-600 ml-auto">
                        {new Date(comment.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 ml-5">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-800/50">
              {!session && (
                <Input 
                  placeholder="Tu nombre (opcional)" 
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs h-8"
                />
              )}
              <div className="flex gap-2">
                <Input 
                  placeholder="Escribe un comentario..." 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && newComment && addComment.mutate()}
                  className="bg-zinc-950 border-zinc-800 text-sm flex-1"
                />
                <Button 
                  size="icon" 
                  onClick={() => newComment && addComment.mutate()}
                  disabled={addComment.isPending || !newComment}
                  className="bg-red-600 hover:bg-red-700 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
