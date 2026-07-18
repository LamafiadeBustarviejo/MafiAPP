import { Card, CardContent } from '@/components/ui/card'
import type { Member } from '@/types'
import { Crown, Shield, Mail, Phone, Calendar, UserX } from 'lucide-react'

interface MemberCardProps {
  member: Member
  isSelected?: boolean
  onClick?: () => void
}

export function MemberCard({ member, isSelected, onClick }: MemberCardProps) {
  const isSuperAdmin = member.profile?.email === 'soyelcharly@gmail.com'
  const roleName = member.role?.name?.toLowerCase() || ''
  const isAdmin = roleName === 'admin' || roleName === 'administrador'
  const isInactive = member.status !== 'active'

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Superadministrador'
    if (isAdmin) return 'Administrador'
    return 'Miembro'
  }

  return (
    <Card 
      className={`bg-zinc-900 transition-colors cursor-pointer active:scale-[0.98] rounded-none border-x-0 border-t-0 first:border-t ${
        isSelected 
          ? 'border-b-red-800 bg-red-950/20' 
          : 'border-b-zinc-800 hover:bg-zinc-800/50'
      } ${isInactive ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="p-3 flex items-center gap-3 relative">
        {/* Avatar */}
        <div className="h-10 w-10 md:h-8 md:w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden text-zinc-400 font-bold uppercase text-xs md:text-[10px]">
          {member.profile?.avatar_url ? (
            <img src={member.profile.avatar_url} alt={member.nickname} className="h-full w-full object-cover" />
          ) : (
            member.nickname.substring(0, 2)
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-100 line-clamp-1 text-sm">{member.nickname}</h3>
            {isInactive && <UserX className="w-3.5 h-3.5 text-red-500 shrink-0" title="Baja / Inactivo" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
            <span className="capitalize text-red-400/80">{getRoleLabel()}</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline truncate">{member.profile?.email || 'Sin email'}</span>
          </div>
        </div>

        {/* Mobile secondary info */}
        <div className="md:hidden flex flex-col items-end shrink-0 text-[10px] text-zinc-500 gap-1">
          {member.profile?.phone && (
            <a href={`tel:${member.profile.phone.replace(/\s+/g, '')}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-md transition-colors text-zinc-300">
              <Phone className="h-3 w-3" />
              Llamar
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}
