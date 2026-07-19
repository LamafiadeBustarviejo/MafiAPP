import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { membersService } from '@/services/members'
import { MemberCard } from '@/features/members/MemberCard'
import { MemberDetail } from '@/features/members/MemberDetail'
import { AddMemberModal } from '@/features/members/AddMemberModal'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Users, UserPlus } from 'lucide-react'
import type { Member } from '@/types'

export function MembersList() {
  const { session } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => membersService.getCurrentMember(session!.user.id),
    enabled: !!session?.user.id
  })

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['members-full'],
    queryFn: membersService.getMembers
  })

  // Filter members
  const filteredMembers = members?.filter(member => {
    if (!debouncedSearch) return true
    const s = debouncedSearch.toLowerCase()
    return (
      member.nickname.toLowerCase().includes(s) || 
      (member.profile?.email && member.profile.email.toLowerCase().includes(s)) ||
      (member.profile?.phone && member.profile.phone.includes(s))
    )
  })

  const selectedMember = members?.find(m => m.id === selectedMemberId)

  if (error) return <div className="p-4 text-center text-red-500">Error al cargar: {(error as Error).message}</div>

  return (
    <div className="p-4 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-red-500" />
            Directorio de Miembros
          </h1>
          <p className="text-sm text-zinc-400">Gestiona los integrantes y roles de la peña.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Buscar por nombre, email, tlf..." 
              className="pl-9 bg-zinc-900/50 border-zinc-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {(currentMember?.role?.name === 'admin' || currentMember?.roles?.name === 'admin' || session?.user?.email === 'soyelcharly@gmail.com') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white font-medium rounded-lg transition-colors border border-red-500 shadow-lg shadow-red-900/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Añadir Miembro</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
        {/* LISTA DE MIEMBROS (Izquierda) */}
        <div className={`w-full md:w-1/3 flex flex-col min-h-0 ${selectedMemberId ? 'hidden md:flex' : 'flex'}`}>
          <div className="overflow-y-auto custom-scrollbar pr-2 space-y-0 rounded-xl overflow-hidden border border-zinc-800/50 pb-20">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
            ) : filteredMembers?.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-zinc-800 rounded-lg text-zinc-400">
                No se encontraron miembros.
              </div>
            ) : (
              filteredMembers?.map(member => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  isSelected={selectedMemberId === member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* DETALLE DEL MIEMBRO (Derecha) */}
        <div className={`w-full md:w-2/3 flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-20 ${!selectedMemberId ? 'hidden md:flex' : 'flex'}`}>
          {selectedMemberId && selectedMember ? (
            <div className="space-y-4">
              <button 
                className="md:hidden text-zinc-400 text-sm flex items-center mb-2 bg-zinc-900 px-3 py-1.5 rounded-md"
                onClick={() => setSelectedMemberId(null)}
              >
                ← Volver a la lista
              </button>
              <MemberDetail member={selectedMember} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/10">
              <div className="text-center space-y-3 max-w-sm px-4">
                <div className="mx-auto w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-zinc-300 font-medium text-lg">Selecciona un miembro</h3>
                <p className="text-zinc-500 text-sm">
                  Haz clic en cualquier tarjeta de la lista para ver su información de contacto, rol en la peña y actividad reciente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && <AddMemberModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
