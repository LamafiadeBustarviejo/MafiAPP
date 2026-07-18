import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { membersService } from '@/services/members'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Member } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Camera } from 'lucide-react'

interface MemberFormProps {
  member: Member
  isAdmin: boolean
  onClose: () => void
}

export function MemberForm({ member, onClose }: MemberFormProps) {
  const queryClient = useQueryClient()
  
  const [nickname, setNickname] = useState(member.nickname)
  const [phone, setPhone] = useState(member.profile?.phone || '')
  const [email, setEmail] = useState(member.profile?.email || '')
  const [password, setPassword] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(member.profile?.avatar_url || null)
  const [error, setError] = useState<string | null>(null)

  const { session } = useAuth()
  const isSelf = session?.user.id === member.profile_id

  const updateMutation = useMutation({
    mutationFn: async () => {
      // 1. Subir imagen si la hay
      let newAvatarUrl = member.profile?.avatar_url
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${member.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)
          
        if (uploadError) throw new Error('Error al subir imagen: ' + uploadError.message)
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
        newAvatarUrl = publicUrl
      }

      // 2. Actualizar perfil (teléfono, email, avatar)
      if (phone !== member.profile?.phone || email !== member.profile?.email || newAvatarUrl !== member.profile?.avatar_url) {
        await membersService.updateProfile(member.profile_id, { phone, email, avatar_url: newAvatarUrl })
      }
      
      // 2. Si el usuario se está editando a sí mismo, intentar cambiar credenciales de Auth
      if (isSelf) {
        const authUpdates: any = {}
        if (email !== session?.user.email && email !== member.profile?.email) authUpdates.email = email
        if (password) authUpdates.password = password
        
        if (Object.keys(authUpdates).length > 0) {
          const { error: authError } = await supabase.auth.updateUser(authUpdates)
          if (authError) {
            throw new Error('Hubo un error al cambiar credenciales de acceso: ' + authError.message)
          }
        }
      }
      
      // 3. Actualizar miembro (nickname)
      if (nickname !== member.nickname) {
        await membersService.updateMember(member.id, { nickname })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-full'] })
      queryClient.invalidateQueries({ queryKey: ['currentMember'] })
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    updateMutation.mutate()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen es demasiado grande. Máximo 2MB.')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-zinc-100 mb-6">Editar Miembro</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center justify-center mb-6 gap-3">
            <div className="relative group cursor-pointer h-24 w-24">
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-full transition-opacity flex items-center justify-center pointer-events-none z-10">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="h-full w-full rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden text-zinc-400 text-3xl font-bold uppercase shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  nickname.substring(0, 2)
                )}
              </div>
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-xs text-zinc-500">Toca para cambiar (Máx. 2MB)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-zinc-400">Apodo / Nombre visible</Label>
            <Input 
              id="nickname" 
              value={nickname} 
              onChange={e => setNickname(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-400">Email de contacto</Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
            <p className="text-xs text-zinc-500">Nota: Cambiar este email solo actualiza el contacto, no cambia el correo de inicio de sesión.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-zinc-400">Teléfono (opcional)</Label>
            <Input 
              id="phone" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
          </div>

          {isSelf && (
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <Label htmlFor="password" className="text-zinc-400">Nueva Contraseña de Acceso (opcional)</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="Dejar en blanco para mantener la actual"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                className="bg-zinc-950 border-zinc-800 placeholder:text-zinc-700"
              />
              <p className="text-xs text-zinc-500">Si escribes algo aquí, tu contraseña de inicio de sesión cambiará inmediatamente.</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-900 rounded-md text-red-400 text-sm">
              Error al guardar: Asegúrate de tener permisos (RLS). {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 bg-zinc-200 text-black hover:bg-zinc-300 border-0"
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
