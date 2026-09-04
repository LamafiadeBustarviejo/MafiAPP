import { supabase } from '@/lib/supabase'
import type { Suggestion, SuggestionComment } from '@/types'

export const suggestionsService = {
  // Obtener todas las sugerencias
  async getSuggestions() {
    const { data, error } = await supabase
      .from('suggestions')
      .select(`
        *,
        creator:members!suggestions_created_by_fkey(*),
        comments_count:suggestion_comments(count)
      `)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data as Suggestion[]
  },

  // Obtener una sugerencia específica
  async getSuggestion(id: string) {
    const { data, error } = await supabase
      .from('suggestions')
      .select(`
        *,
        creator:members!suggestions_created_by_fkey(*)
      `)
      .eq('id', id)
      .single()
      
    if (error) throw error
    return data as Suggestion
  },

  // Crear una nueva sugerencia
  async createSuggestion(suggestion: Partial<Suggestion>) {
    const { data, error } = await supabase
      .from('suggestions')
      .insert(suggestion)
      .select()
      .single()
      
    if (error) throw error
    return data as Suggestion
  },

  // Obtener comentarios de una sugerencia
  async getComments(suggestionId: string) {
    const { data, error } = await supabase
      .from('suggestion_comments')
      .select(`
        *,
        author:members!suggestion_comments_author_id_fkey(*, profile:profiles(avatar_url))
      `)
      .eq('suggestion_id', suggestionId)
      .order('created_at', { ascending: true })
      
    if (error) throw error
    return data as SuggestionComment[]
  },

  // Añadir un comentario a una sugerencia
  async addComment(comment: { suggestion_id: string, author_id: string, content: string }) {
    const { data, error } = await supabase
      .from('suggestion_comments')
      .insert(comment)
      .select()
      .single()
      
    if (error) throw error
    return data as SuggestionComment
  },

  // Actualizar un comentario
  async updateComment(id: string, content: string) {
    const { data, error } = await supabase
      .from('suggestion_comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return data as SuggestionComment
  },

  // Eliminar un comentario
  async deleteComment(id: string) {
    const { error } = await supabase
      .from('suggestion_comments')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  }
}
