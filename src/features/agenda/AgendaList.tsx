import { useState, useEffect } from 'react'
import type { CalendarEvent } from '@/services/calendar'
import { Calendar, MapPin, Clock, Music, Wine, PartyPopper, Image as ImageIcon } from 'lucide-react'

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

  // Agrupar eventos por día
  const groupedEvents = events.reduce((acc, event) => {
    const startDate = event.start.dateTime || event.start.date
    if (!startDate) return acc
    const dateObj = new Date(startDate)
    const dateKey = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  return (
    <div className="space-y-10">
      {Object.entries(groupedEvents || {}).map(([dateLabel, dayEvents]) => (
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

              return (
                <div 
                  key={event.id} 
                  className={`relative flex gap-4 transition-all duration-500 ${past ? 'opacity-40 grayscale' : 'opacity-100 hover:-translate-y-1'}`}
                >
                  <div className="relative z-10 flex flex-col items-center shrink-0 mt-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] border-black shadow-xl ${current ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white animate-pulse' : past ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-800 text-zinc-300'}`}>
                      {getEventIcon(event.summary)}
                    </div>
                  </div>
                  
                  <div className={`flex-1 rounded-3xl p-5 border shadow-2xl backdrop-blur-sm ${current ? 'bg-red-950/20 border-red-900/50' : 'bg-zinc-900/40 border-zinc-800/50'}`}>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      {firstAttachment ? (
                        <a href={firstAttachment.fileUrl} target="_blank" rel="noopener noreferrer" className={`text-lg font-bold leading-tight flex items-center gap-2 hover:underline hover:text-emerald-400 transition-colors ${current ? 'text-red-400' : 'text-zinc-100'}`}>
                          {event.summary}
                          <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                        </a>
                      ) : (
                        <h3 className={`text-lg font-bold leading-tight ${current ? 'text-red-400' : 'text-zinc-100'}`}>
                          {event.summary}
                        </h3>
                      )}
                      
                      {current && (
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
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
