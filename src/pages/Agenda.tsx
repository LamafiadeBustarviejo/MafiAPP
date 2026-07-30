import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { calendarService } from '@/services/calendar'
import { Calendar, MapPin, Clock, ArrowLeft, Loader2, Music, Wine, PartyPopper } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function Agenda() {
  const [now, setNow] = useState(new Date())

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['agenda'],
    queryFn: calendarService.getUpcomingEvents,
    refetchInterval: 60000 * 5 // 5 min
  })

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
  const groupedEvents = events?.reduce((acc, event) => {
    const startDate = event.start.dateTime || event.start.date
    if (!startDate) return acc
    const dateObj = new Date(startDate)
    const dateKey = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  return (
    <div className="min-h-screen bg-black text-white relative font-sans">
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-900 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full bg-zinc-900/50 border border-zinc-800">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Agenda Oficial
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Fiestas de Bustarviejo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-8 pb-20 mt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-sm text-zinc-500 uppercase tracking-widest font-semibold">Sincronizando agenda...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 bg-red-950/20 rounded-2xl border border-red-900/30">
            <p className="font-semibold mb-2">Error de conexión</p>
            <p className="text-sm opacity-80">{(error as Error).message}</p>
          </div>
        ) : !events?.length ? (
          <div className="text-center p-16 border border-dashed border-zinc-800 rounded-3xl text-zinc-500 bg-zinc-950/30">
            <PartyPopper className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Aún no hay eventos programados.</p>
            <p className="text-sm mt-1 opacity-70">El calendario está vacío.</p>
          </div>
        ) : (
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
                            <h3 className={`text-lg font-bold leading-tight ${current ? 'text-red-400' : 'text-zinc-100'}`}>
                              {event.summary}
                            </h3>
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
        )}
      </div>
    </div>
  )
}
