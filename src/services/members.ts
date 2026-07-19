import { supabase } from '@/lib/supabase'
import type { Member, Profile, Task, InventoryItem } from '@/types'

export const membersService = {
  // Obtener todos los miembros
  async getMembers() {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        profile:profiles(*),
        role:roles(*)
      `)
      .order('nickname', { ascending: true })
    
    if (error) throw error
    return data as Member[]
  },

  // Añadir un nuevo miembro (Solo para Admins)
  async createMember(data: { email: string; password?: string; nickname: string; phone?: string; role_id: string }) {
    // 1. Cliente temporal para no cerrar la sesión del admin actual
    const { createClient } = await import('@supabase/supabase-js')
    const tempClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false }
      }
    )

    // 2. Crear el usuario en Auth
    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: data.email,
      password: data.password || 'mafiapp2026'
    })

    if (authError) throw new Error('Error de acceso: ' + authError.message)
    if (!authData.user) throw new Error('No se pudo crear el usuario')

    // 3. Configurar el perfil y ficha vía función RPC
    const { error: rpcError } = await supabase.rpc('admin_setup_new_member', {
      p_user_id: authData.user.id,
      p_email: data.email,
      p_nickname: data.nickname,
      p_phone: data.phone || null,
      p_role_id: data.role_id
    })

    if (rpcError) throw new Error('Error de configuración: ' + rpcError.message)
    return true
  },

  // Obtener el miembro actual a partir del auth.user.id
  async getCurrentMember(userId: string) {
    const { data, error } = await supabase
      .from('members')
      .select('*, profile:profiles(*), role:roles(*)')
      .eq('profile_id', userId)
      .single()
    if (error) throw error
    return data as Member
  },

  // Obtener un miembro específico
  async getMember(id: string) {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        profile:profiles(*),
        role:roles(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Member
  },

  // Obtener roles disponibles
  async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true })
      
    if (error) throw error
    return data
  },

  // Actualizar el "Member" (Datos de la peña)
  async updateMember(id: string, updates: Partial<Member>) {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Member
  },

  // Actualizar el "Profile" (Datos personales)
  async updateProfile(profileId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single()
    
    if (error) throw error
    return data as Profile
  },

  // Obtener las tareas pendientes de un miembro
  async getMemberTasks(memberId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', memberId)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true })
      
    if (error) throw error
    return data as Task[]
  },

  // Obtener los artículos asignados a un miembro
  async getMemberItems(memberId: string) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*, category:inventory_categories(name)')
      .eq('owner_id', memberId)
      
    if (error) throw error
    return data as InventoryItem[]
  },
  
  // Obtener últimas acciones en el historial de un usuario
  async getMemberHistory(profileId: string) {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('performed_by', profileId)
      .order('created_at', { ascending: false })
      .limit(10)
      
    if (error) throw error
    return data
  }
}
