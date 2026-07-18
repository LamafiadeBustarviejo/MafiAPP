import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsService } from '@/services/alerts'
import { useAuth } from '@/hooks/useAuth'
import { Bell, Check, Loader2, Info, AlertTriangle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.user?.id

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Cargar notificaciones
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => userId ? alertsService.getUserNotifications(userId) : [],
    enabled: !!userId,
    refetchInterval: 60000 // Refrescar cada minuto por si acaso
  })

  // Suscribirse a nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  // Mutaciones para marcar como leídas
  const markAsRead = useMutation({
    mutationFn: alertsService.markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  })

  const markAllAsRead = useMutation({
    mutationFn: () => alertsService.markAllAsRead(userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  })

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  const getIcon = (type: string) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Info className="w-4 h-4 text-emerald-500" />
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-400 hover:text-white relative rounded-full hover:bg-zinc-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-zinc-900 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
            <h3 className="font-semibold text-zinc-100">Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium disabled:opacity-50"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
            ) : !notifications?.length ? (
              <div className="text-center p-8 text-zinc-500 text-sm">
                No tienes notificaciones
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 flex gap-3 transition-colors ${notification.read ? 'bg-zinc-900 opacity-70' : 'bg-zinc-800/30'}`}
                  >
                    <div className="mt-1 shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${notification.read ? 'text-zinc-300' : 'text-zinc-100'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <button 
                        onClick={() => markAsRead.mutate(notification.id)}
                        disabled={markAsRead.isPending}
                        className="shrink-0 text-zinc-500 hover:text-emerald-400 p-1 rounded-md hover:bg-zinc-800 self-start"
                        title="Marcar como leída"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
