import { Outlet, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersService } from '@/services/members'
import { Menu, LogOut, Home, Package, CheckSquare, DollarSign, Users, History, Bell, AlertTriangle, Calendar, Image as ImageIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { NotificationsMenu } from '@/features/alerts/NotificationsMenu'
import { EmergencyBanner } from '@/features/alerts/EmergencyBanner'
import { alertsService } from '@/services/alerts'

export function AppLayout() {
  const { session, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCharlyPopup, setShowCharlyPopup] = useState(false)
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [sosMessage, setSosMessage] = useState('')
  const queryClient = useQueryClient()

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    if (permission === 'granted') {
      alert("¡Notificaciones activadas! Ahora tu móvil vibrará y te avisará cuando haya un SOS, incluso con la app minimizada.")
    } else {
      alert("Has bloqueado las notificaciones. No recibirás avisos si no estás mirando la app.")
    }
  }

  const { data: member, isLoading: isLoadingMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => membersService.getCurrentMember(session!.user.id),
    enabled: !!session?.user.id
  })

  const sosMutation = useMutation({
    mutationFn: () => alertsService.createEmergency(member!.id, sosMessage.trim() || '¡URGENTE! Se requiere asistencia inmediata.'),
    onSuccess: () => {
      setShowSOSModal(false)
      setSosMessage('')
      queryClient.invalidateQueries({ queryKey: ['active-emergencies'] })
    }
  })

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Cargando...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navigation = [
    { name: 'Mi Situación', icon: Home, href: '/' },
    { name: 'Inventario', icon: Package, href: '/inventory' },
    { name: 'Tareas', icon: CheckSquare, href: '/tasks' },
    { name: 'Finanzas', icon: DollarSign, href: '/finances' },
    { name: 'Nuestros eventos', icon: Calendar, href: '/events' },
    { name: 'Tablón de fiestas', icon: ImageIcon, href: '/posters' },
    { name: 'Miembros', icon: Users, href: '/members' },
  ]

  const roleName = member?.role?.name?.toLowerCase() || member?.roles?.name?.toLowerCase() || ''
  const isAdmin = roleName === 'admin' || roleName === 'administrador' || session?.user?.email === 'soyelcharly@gmail.com'

  if (isAdmin) {
    navigation.push({ name: 'Histórico', icon: History, href: '/history' })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-28 md:h-36 w-full flex items-center justify-center border-b border-zinc-800 overflow-hidden shrink-0 bg-zinc-950/50">
            <img src="/logo.png" alt="La MafiAPP" className="w-11/12 h-11/12 object-contain mix-blend-screen" />
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center gap-4 px-4 py-3 text-zinc-400 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-6 h-6 shrink-0" />
                <span className="text-base md:text-lg font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 md:p-6 border-t border-zinc-800 shrink-0">
            <div className="flex justify-center items-center gap-6 py-2 mb-4 w-full">
              <a 
                href="https://chat.whatsapp.com/CG6SOYOYuYT99mEf13qQX6?s=sw&p=a&ilr=1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:scale-105 transition-transform cursor-pointer"
                title="Chat de la Peña"
              >
                <img src="/whatsapp-mafia.png" alt="Chat de la Peña" className="h-14 md:h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
              </a>
              {isAdmin && (
                <a 
                  href="https://chat.whatsapp.com/If0CuTH2PMF9KtmsymHZSw?s=sw&p=a&ilr=1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform cursor-pointer"
                  title="Chat de la Cúpula"
                >
                  <img src="/whatsapp-cupula.jpg" alt="Chat de la Cúpula" className="h-14 md:h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(217,119,6,0.3)] rounded-full" />
                </a>
              )}
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 px-4 py-3 w-full text-zinc-400 rounded-lg hover:bg-zinc-800 hover:text-red-400 transition-colors text-base font-medium mt-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <EmergencyBanner isAdmin={isAdmin} currentMemberId={member?.id} />
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 flex justify-end items-center pr-4">
            {member && (
              <span className="text-emerald-400 font-medium text-sm md:text-base animate-in fade-in slide-in-from-right-4 duration-500">
                ¡Buenas, {member.nickname}! 👋
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {notificationPermission === 'default' && (
              <button 
                onClick={requestNotificationPermission}
                className="hidden md:flex items-center gap-2 text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-full hover:bg-emerald-900 transition-colors"
              >
                <Bell className="w-3.5 h-3.5 animate-pulse" />
                Activar alertas
              </button>
            )}
            {notificationPermission === 'default' && (
              <button 
                onClick={requestNotificationPermission}
                className="md:hidden text-emerald-400 p-2 relative"
                title="Activar Alertas"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              </button>
            )}

            <NotificationsMenu />
            <button 
              onClick={() => setShowCharlyPopup(true)}
              className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              U
            </button>
          </div>
        </header>

        {/* Outlet / Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Pop-up de Charly */}
      {showCharlyPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCharlyPopup(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-8 max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-emerald-400">Aplicación diseñada por Charly.</h3>
            
            <div className="flex justify-center py-2">
              <img src="/creator.png" alt="Charly" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)] border-2 border-zinc-800" />
            </div>
            
            <div className="space-y-3 py-4">
              <p className="text-zinc-300 text-lg">Si estas agradecido, díselo.</p>
              <p className="text-red-400 font-bold text-lg">Si te está molestando.... ¡ANDA PALLÁ!</p>
              <p className="text-3xl font-black text-white pt-4 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">TORNA VOLARE!!!</p>
            </div>

            <button 
              onClick={() => setShowCharlyPopup(false)}
              className="mt-6 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors w-full"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Floating Emergency Button */}
      <button 
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg shadow-red-900/50 flex items-center justify-center hover:bg-red-500 hover:scale-105 active:scale-95 transition-all duration-200 ring-4 ring-red-950"
        title="Emergencia"
        onClick={() => setShowSOSModal(true)}
      >
        <span className="text-sm font-bold tracking-widest">SOS</span>
      </button>

      {/* SOS Confirmation Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowSOSModal(false)}>
          <div className="bg-zinc-900 border border-red-900 rounded-xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <div className="mx-auto w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¿Activar SOS?</h3>
            <p className="text-zinc-400 mb-4 text-sm">Esto enviará una alerta urgente a todos los miembros de la Peña que tengan la aplicación abierta.</p>
            
            <textarea 
              value={sosMessage}
              onChange={(e) => setSosMessage(e.target.value)}
              placeholder="Ej: Necesitamos hielos urgentes en la plaza"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white placeholder:text-zinc-600 mb-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 resize-none h-24 text-sm"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSOSModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => sosMutation.mutate()}
                disabled={sosMutation.isPending || !member}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {sosMutation.isPending ? 'Enviando...' : 'ACTIVAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
