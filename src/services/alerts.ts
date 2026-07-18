import { supabase } from '@/lib/supabase'
import type { AppNotification, EmergencyAlert } from '@/types'

export const alertsService = {
  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  
  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      
    if (error) throw error
    return data as AppNotification[]
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      
    if (error) throw error
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      
    if (error) throw error
  },

  // ==========================================
  // EMERGENCIES (SOS)
  // ==========================================

  async getActiveEmergencies() {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select(`
        *,
        reporter:members!emergency_alerts_reported_by_fkey(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data as EmergencyAlert[]
  },

  async createEmergency(memberId: string, message: string) {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert([{
        reported_by: memberId,
        message,
        status: 'active'
      }])
      .select()
      .single()
      
    if (error) throw error
    return data as EmergencyAlert
  },

  async resolveEmergency(alertId: string, adminMemberId: string) {
    const { error } = await supabase
      .from('emergency_alerts')
      .update({ 
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: adminMemberId
      })
      .eq('id', alertId)
      
    if (error) throw error
  }
}
