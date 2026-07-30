import { supabase } from '@/lib/supabase'

export interface AgendaComment {
  id: string
  event_id: string
  author_name: string
  content: string
  created_at: string
}

export const agendaCommentsService = {
  // Obtener comentarios de todos los eventos
  async getCommentsByEventIds(eventIds: string[]): Promise<Record<string, AgendaComment[]>> {
    if (!eventIds.length) return {}

    const { data, error } = await supabase
      .from('agenda_comments')
      .select('*')
      .in('event_id', eventIds)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching agenda comments:', error)
      return {}
    }

    // Agrupar por event_id
    const grouped: Record<string, AgendaComment[]> = {}
    data?.forEach(comment => {
      if (!grouped[comment.event_id]) grouped[comment.event_id] = []
      grouped[comment.event_id].push(comment)
    })

    return grouped
  },

  async createComment(eventId: string, authorName: string, content: string): Promise<AgendaComment> {
    const { data, error } = await supabase
      .from('agenda_comments')
      .insert([
        { event_id: eventId, author_name: authorName, content }
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('agenda_comments')
      .delete()
      .eq('id', commentId)

    if (error) throw new Error(error.message)
  }
}
