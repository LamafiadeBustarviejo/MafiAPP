import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { membersService } from '@/services/members'
import { financesService } from '@/services/finances'
import { useAuth } from '@/hooks/useAuth'
import type { Member } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Box, CheckCircle2, CircleDashed, History, Wallet, Crown, Mail, Phone, Edit2 } from 'lucide-react'
import { MemberForm } from './MemberForm'

interface MemberDetailProps {
  member: Member
}

export function MemberDetail({ member }: MemberDetailProps) {
  const { session } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  
  // Fetch current user member profile to check admin rights
  const { data: currentUserMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => session?.user.id ? membersService.getCurrentMember(session.user.id) : null,
    enabled: !!session?.user.id
  })
  
  const isAdmin = currentUserMember?.role?.name === 'admin' || currentUserMember?.roles?.name === 'admin' || session?.user?.email === 'soyelcharly@gmail.com'
  const canEdit = isAdmin || session?.user.id === member.profile_id
  // Cargar datos paralelos: Tareas asignadas y Artículos en propiedad
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['member-tasks', member.id],
    queryFn: () => membersService.getMemberTasks(member.id)
  })

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['member-items', member.id],
    queryFn: () => membersService.getMemberItems(member.id)
  })
  
  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['member-history', member.profile_id],
    queryFn: () => membersService.getMemberHistory(member.profile_id)
  })

  const { data: balance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['member-balance', member.id],
    queryFn: () => financesService.getMemberBalance(member.id)
  })

  const isSuperAdmin = member.profile?.email === 'soyelcharly@gmail.com'
  const roleName = member.role?.name?.toLowerCase() || ''
  const isMemberAdmin = roleName === 'admin' || roleName === 'administrador'
  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Superadministrador'
    if (isMemberAdmin) return 'Administrador'
    return 'Miembro'
  }

  return (
    <div className="space-y-4">
      {/* 1. Información Principal */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
            <div className="h-24 w-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden text-zinc-400 text-3xl font-bold uppercase shadow-lg">
              {member.profile?.avatar_url ? (
                <img src={member.profile.avatar_url} alt={member.nickname} className="h-full w-full object-cover" />
              ) : (
                member.nickname.substring(0, 2)
              )}
            </div>
            
            <div className="space-y-3 flex-1">
              <div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h2 className="text-2xl font-bold text-zinc-100">{member.nickname}</h2>
                </div>
                <p className="text-sm text-zinc-400 capitalize">
                  {getRoleLabel()}
                </p>
              </div>
              
              <div className="flex flex-col gap-2 text-sm text-zinc-300">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  {member.profile?.email || '-'}
                </div>
                {member.profile?.phone && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    {member.profile.phone}
                  </div>
                )}
              </div>
            </div>
            
            {canEdit && (
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-4 md:mt-0 p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors flex items-center gap-2 text-sm shrink-0"
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden md:inline">Editar</span>
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 2. Tareas Activas */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-zinc-400" />
              Tareas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingTasks ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
            ) : !tasks?.length ? (
              <p className="text-sm text-zinc-500 text-center py-4">No tiene tareas pendientes.</p>
            ) : (
              <ul className="space-y-3">
                {tasks.map(task => (
                  <li key={task.id} className="flex items-start gap-2 text-sm">
                    <CircleDashed className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-zinc-200">{task.title}</span>
                      {task.due_date && <div className="text-xs text-zinc-500">{new Date(task.due_date).toLocaleDateString()}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 3. Inventario Prestado */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="w-5 h-5 text-zinc-400" />
              Inventario Asignado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingItems ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
            ) : !items?.length ? (
              <p className="text-sm text-zinc-500 text-center py-4">No tiene ningún objeto asignado.</p>
            ) : (
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.id} className="flex items-center gap-2 text-sm justify-between">
                    <span className="text-zinc-200 truncate">{item.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full shrink-0">
                      Cant: {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 4. Tesorería / Saldo a favor */}
        <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-zinc-400" />
              Tesorería (Saldo con la Peña)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center justify-center">
            {isLoadingBalance ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            ) : (
              <div className={`p-4 rounded-xl border w-full max-w-sm flex items-center justify-between ${(balance || 0) > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="text-left">
                  <div className="text-xs font-medium text-zinc-400 mb-1">
                    {(balance || 0) > 0 ? 'La peña le debe:' : 'Cuentas al día'}
                  </div>
                  <div className={`text-2xl font-bold ${(balance || 0) > 0 ? 'text-orange-500' : 'text-zinc-500'}`}>
                    {(balance || 0).toFixed(2)} €
                  </div>
                </div>
                <Wallet className={`w-8 h-8 ${(balance || 0) > 0 ? 'text-orange-500/50' : 'text-zinc-700'}`} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Historial Reciente */}
        <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-400" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingHistory ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
            ) : !history?.length ? (
              <p className="text-sm text-zinc-500 text-center py-4">No hay actividad registrada.</p>
            ) : (
              <div className="space-y-4">
                {history.map(record => (
                  <div key={record.id} className="text-sm flex gap-3">
                    <div className="text-xs text-zinc-500 shrink-0 w-24">
                      {new Date(record.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-zinc-300">
                      Operación <span className="font-medium text-zinc-100">{record.action}</span> en tabla <span className="text-red-400">{record.table_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isEditing && (
        <MemberForm 
          member={member} 
          onClose={() => setIsEditing(false)} 
        />
      )}
    </div>
  )
}
