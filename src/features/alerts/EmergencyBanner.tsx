import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsService } from '@/services/alerts'
import { useAuth } from '@/hooks/useAuth'
import { AlertTriangle, Loader2, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface EmergencyBannerProps {
  isAdmin: boolean
  currentMemberId: string | undefined
}

export function EmergencyBanner({ isAdmin, currentMemberId }: EmergencyBannerProps) {
  const queryClient = useQueryClient()
  
  // Audio ref for alarm sound
  const [playAlarm, setPlayAlarm] = useState(false)

  const { data: emergencies, isLoading } = useQuery({
    queryKey: ['active-emergencies'],
    queryFn: alertsService.getActiveEmergencies,
    refetchInterval: 30000 // Refrescar cada 30 segundos
  })

  // Escuchar nuevas emergencias en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('public:emergency_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_alerts'
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['active-emergencies'] })
          // Si es una nueva alerta activa, reproducimos el sonido
          if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
            setPlayAlarm(true)
            setTimeout(() => setPlayAlarm(false), 5000) // Parar después de 5s

            // Try to trigger local notification
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                // Si hay Service Worker activo, es mejor usarlo para que vibre en móviles
                if (navigator.serviceWorker) {
                  navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification("🚨 EMERGENCIA EN LA PEÑA 🚨", {
                      body: "¡Alguien ha pulsado el botón SOS! Pulsa para ver.",
                      icon: "/logo.png",
                      vibrate: [500, 250, 500, 250, 500],
                      requireInteraction: true,
                      tag: 'sos-alert'
                    });
                  }).catch(() => {
                    new Notification("🚨 EMERGENCIA EN LA PEÑA 🚨", {
                      body: "¡Alguien ha pulsado el botón SOS!",
                      icon: "/logo.png",
                      requireInteraction: true
                    });
                  });
                } else {
                  new Notification("🚨 EMERGENCIA EN LA PEÑA 🚨", {
                    body: "¡Alguien ha pulsado el botón SOS!",
                    icon: "/logo.png",
                    requireInteraction: true
                  });
                }
              } catch(e) {
                console.error("Error showing notification", e);
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsService.resolveEmergency(id, currentMemberId || ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-emergencies'] })
  })

  if (isLoading || !emergencies || emergencies.length === 0) return null

  return (
    <div className="w-full relative z-50">
      {emergencies.map(emergency => (
        <div 
          key={emergency.id} 
          className="bg-red-600 text-white w-full shadow-[0_4px_30px_rgba(220,38,38,0.5)] border-b-4 border-red-800 animate-in slide-in-from-top flex flex-col md:flex-row items-center justify-between px-4 py-3 md:px-6 gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 animate-pulse shrink-0" />
            <div>
              <p className="font-bold text-lg md:text-xl uppercase tracking-wider flex items-center gap-2">
                {emergency.message}
              </p>
              <p className="text-red-100 text-sm mt-0.5">
                Enviada por <span className="font-bold">{emergency.reporter?.nickname || 'Un miembro'}</span> a las {new Date(emergency.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
            {isAdmin ? (
              <button
                onClick={() => resolveMutation.mutate(emergency.id)}
                disabled={resolveMutation.isPending}
                className="bg-red-900/50 hover:bg-red-900 border border-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto"
              >
                {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Marcar como Resuelta
              </button>
            ) : (
              <div className="bg-red-900/40 text-red-100 px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 w-full md:w-auto">
                <Info className="w-4 h-4" />
                Esperando a un admin
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
