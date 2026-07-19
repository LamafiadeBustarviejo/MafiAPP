import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { membersService } from '@/services/members'
import { Loader2, UserPlus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddMemberModalProps {
  onClose: () => void
}

export function AddMemberModal({ onClose }: AddMemberModalProps) {
  const queryClient = useQueryClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('mafiapp2026')
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [roleId, setRoleId] = useState('')
  const [error, setError] = useState('')

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: membersService.getRoles
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (!email || !nickname || !roleId) {
        throw new Error('El email, nombre y rol son obligatorios.')
      }
      return membersService.createMember({
        email,
        password,
        nickname,
        phone,
        role_id: roleId
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-full'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.message || 'Error al añadir el miembro')
    }
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-red-500" />
            Añadir Nuevo Miembro
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-800 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-zinc-400">Email de acceso (Obligatorio)</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="nuevo@mafiapp.local"
              className="bg-zinc-950 border-zinc-800"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400">Contraseña inicial</Label>
            <Input 
              type="text" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="bg-zinc-950 border-zinc-800"
            />
            <p className="text-xs text-zinc-500">Puedes dejarla así, el usuario podrá cambiarla luego.</p>
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400">Nombre / Apodo en la Peña (Obligatorio)</Label>
            <Input 
              type="text" 
              value={nickname} 
              onChange={e => setNickname(e.target.value)} 
              placeholder="Ej. El fiera"
              className="bg-zinc-950 border-zinc-800"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400">Teléfono (Opcional)</Label>
            <Input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+34 600 000 000"
              className="bg-zinc-950 border-zinc-800"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400">Rol (Obligatorio)</Label>
            <select 
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 text-sm"
            >
              <option value="">Selecciona un rol...</option>
              {roles?.map(role => {
                const displayName = role.name.toLowerCase() === 'admin' 
                  ? 'Administrador' 
                  : role.name.toLowerCase() === 'member' 
                    ? 'Miembro' 
                    : role.name
                return <option key={role.id} value={role.id}>{displayName}</option>
              })}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Añadir Miembro
          </button>
        </div>
      </div>
    </div>
  )
}
