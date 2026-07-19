import { supabase } from '@/lib/supabase'
import type { FinanceMovement, FinanceAttachment } from '@/types'

export const financesService = {
  // Obtener todos los movimientos financieros
  async getMovements() {
    const { data, error } = await supabase
      .from('financial_movements')
      .select(`
        *,
        member:members!financial_movements_member_id_fkey(id, nickname, profile:profiles(avatar_url)),
        creator:members!financial_movements_created_by_fkey(id, nickname),
        attachments:financial_attachments(*)
      `)
      .order('date', { ascending: false })
      
    if (error) throw error
    return data as FinanceMovement[]
  },

  // Obtener un movimiento específico
  async getMovement(id: string) {
    const { data, error } = await supabase
      .from('financial_movements')
      .select(`
        *,
        member:members!financial_movements_member_id_fkey(id, nickname, profile:profiles(avatar_url)),
        creator:members!financial_movements_created_by_fkey(id, nickname),
        attachments:financial_attachments(*)
      `)
      .eq('id', id)
      .single()
      
    if (error) throw error
    return data as FinanceMovement
  },

  // Crear un nuevo movimiento
  async createMovement(movement: Partial<FinanceMovement>) {
    const { data, error } = await supabase
      .from('financial_movements')
      .insert(movement)
      .select()
      .single()
      
    if (error) throw error
    return data as FinanceMovement
  },

  // Actualizar un movimiento existente
  async updateMovement(id: string, updates: Partial<FinanceMovement>) {
    const { data, error } = await supabase
      .from('financial_movements')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return data as FinanceMovement
  },

  // Subir un justificante a Storage y registrarlo en base de datos
  async uploadAttachment(movementId: string, file: File, uploaderId: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${movementId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    
    // Subir el archivo al bucket "receipts"
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, file)
      
    if (uploadError) throw uploadError
    
    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName)
      
    // Registrar el archivo en financial_attachments
    const { data, error } = await supabase
      .from('financial_attachments')
      .insert({
        movement_id: movementId,
        file_url: publicUrl,
        uploaded_by: uploaderId
      })
      .select()
      .single()
      
    if (error) throw error
    return data as FinanceAttachment
  },
  
  // Obtener historial de auditoría de un movimiento concreto
  async getMovementHistory(movementId: string) {
    const { data, error } = await supabase
      .from('history')
      .select('*, profile:profiles!history_performed_by_fkey(email)')
      .eq('table_name', 'financial_movements')
      .eq('record_id', movementId)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data
  },

  // Comprobar si un miembro ha pagado la cuota (o tiene registro de cuota)
  async getMemberFeeStatus(memberId: string) {
    const { data, error } = await supabase
      .from('financial_movements')
      .select('*')
      .eq('member_id', memberId)
      .eq('type', 'fee')
      .order('date', { ascending: false })
      .limit(1)
      
    if (error) throw error
    return data.length > 0 ? data[0] : null
  },

  // Obtener saldo a favor de un miembro (Lo que la peña le debe)
  async getMemberBalance(memberId: string) {
    const { data, error } = await supabase
      .from('financial_movements')
      .select('amount, type')
      .eq('member_id', memberId)
      .in('type', ['expense', 'compensation'])

    if (error) throw error

    let balance = 0
    data?.forEach(mov => {
      const amount = Number(mov.amount)
      if (mov.type === 'expense') balance += amount
      else if (mov.type === 'compensation') balance -= amount
    })

    return balance
  },

  // Obtener la lista de gastos realizados por un miembro
  async getMemberExpenses(memberId: string) {
    const { data, error } = await supabase
      .from('financial_movements')
      .select('*')
      .eq('member_id', memberId)
      .eq('type', 'expense')
      .order('date', { ascending: false })

    if (error) throw error
    return data as FinanceMovement[]
  }
}
