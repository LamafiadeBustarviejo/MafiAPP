import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

export const exportService = {
  async exportDatabaseToExcel() {
    try {
      // 1. Fetch all data
      const [
        { data: members },
        { data: tasks },
        { data: inventory },
        { data: finances },
        { data: history }
      ] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('tasks').select('*, created_by(nickname), assigned_to(nickname)'),
        supabase.from('inventory_items').select('*, current_holder(nickname), created_by(nickname)'),
        supabase.from('financial_movements').select('*, member_id(nickname), created_by(nickname)'),
        supabase.from('history').select('*, user_id(nickname)')
      ])

      // 2. Format data for Excel
      const membersData = members?.map(m => ({
        ID: m.id,
        Nombre: m.nickname,
        Rol: m.role_id,
        Estado: m.status,
        Fecha_Registro: m.join_date ? new Date(m.join_date).toLocaleDateString() : ''
      })) || []

      const tasksData = tasks?.map(t => ({
        ID: t.id,
        Título: t.title,
        Descripción: t.description,
        Evento: t.event,
        Estado: t.status,
        Fecha_Límite: t.due_date ? new Date(t.due_date).toLocaleDateString() : '',
        Asignado_A: t.assigned_to?.nickname || 'Sin asignar',
        Creado_Por: t.created_by?.nickname || 'Sistema'
      })) || []

      const inventoryData = inventory?.map(i => ({
        ID: i.id,
        Nombre: i.name,
        Cantidad: i.quantity,
        Categoría: i.category,
        Ubicación: i.location,
        Estado: i.status,
        Sirve_Para: i.event,
        Poseedor_Actual: i.current_holder?.nickname || '',
        Creado_Por: i.created_by?.nickname || 'Sistema'
      })) || []

      const financesData = finances?.map(f => ({
        ID: f.id,
        Concepto: f.concept,
        Tipo: f.type,
        Cantidad: f.amount,
        Categoría: f.category,
        Relacionado_Con: f.event,
        Miembro: f.member_id?.nickname || 'Peña La Mafia',
        Fecha: f.date ? new Date(f.date).toLocaleDateString() : '',
        Estado: f.status
      })) || []

      const historyData = history?.map(h => ({
        ID: h.id,
        Tabla: h.table_name,
        Registro_ID: h.record_id,
        Acción: h.action,
        Usuario: h.user_id?.nickname || 'Sistema',
        Fecha: h.created_at ? new Date(h.created_at).toLocaleString() : ''
      })) || []

      // 3. Create Workbook and Worksheets
      const wb = XLSX.utils.book_new()
      
      const wsFinances = XLSX.utils.json_to_sheet(financesData)
      XLSX.utils.book_append_sheet(wb, wsFinances, 'Finanzas')

      const wsTasks = XLSX.utils.json_to_sheet(tasksData)
      XLSX.utils.book_append_sheet(wb, wsTasks, 'Tareas')

      const wsInventory = XLSX.utils.json_to_sheet(inventoryData)
      XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventario')

      const wsMembers = XLSX.utils.json_to_sheet(membersData)
      XLSX.utils.book_append_sheet(wb, wsMembers, 'Miembros')

      const wsHistory = XLSX.utils.json_to_sheet(historyData)
      XLSX.utils.book_append_sheet(wb, wsHistory, 'Historial')

      // 4. Generate and download file
      const dateStr = new Date().toISOString().split('T')[0]
      const fileName = `MafiAPP_Exportacion_${dateStr}.xlsx`
      
      XLSX.writeFile(wb, fileName)
      
      return true
    } catch (error) {
      console.error("Error exporting database:", error)
      throw error
    }
  }
}
