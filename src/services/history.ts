import { supabase } from '@/lib/supabase'

export interface HistoryRecord {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_data: any
  new_data: any
  performed_by: string
  performed_at: string
  author?: {
    id: string
    nickname: string
    profile_id: string
  }
}

export const historyService = {
  getHistory: async (): Promise<HistoryRecord[]> => {
    // 1. Obtener el historial (usando created_at)
    const { data: historyData, error: historyError } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (historyError) throw historyError
    
    // 2. Extraer IDs únicos de perfiles
    const profileIds = [...new Set(historyData.map(r => r.performed_by).filter(Boolean))]
    
    // 3. Buscar los miembros asociados a esos perfiles
    let membersMap: Record<string, any> = {}
    if (profileIds.length > 0) {
      const { data: membersData } = await supabase
        .from('members')
        .select('id, nickname, profile_id')
        .in('profile_id', profileIds)
        
      if (membersData) {
        membersData.forEach(m => {
          membersMap[m.profile_id] = m
        })
      }
    }
    
    // 4. Mapear los datos combinados
    return historyData.map(record => ({
      ...record,
      performed_at: record.created_at, // mapeamos created_at a performed_at para la UI
      author: membersMap[record.performed_by] || null
    }))
  }
}
