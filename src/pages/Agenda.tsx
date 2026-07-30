import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { calendarService } from '@/services/calendar'
import { ArrowLeft, Loader2, PartyPopper } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AgendaList } from '@/features/agenda/AgendaList'

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
          <AgendaList events={events} />
        )}
      </div>
    </div>
  )
}
