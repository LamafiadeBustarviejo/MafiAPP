import { supabase } from '@/lib/supabase'
import type { Task, TaskComment } from '@/types'

export const tasksService = {
  // Obtener todas las tareas con sus relaciones y conteo de comentarios
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:members!assignee_id(*),
        creator:members!created_by(*),
        comments_count:task_comments(count)
      `)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as unknown as Task[]
  },

  // Obtener una tarea específica
  async getTask(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:members!assignee_id(*),
        creator:members!created_by(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Task
  },

  // Crear nueva tarea
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'assignee' | 'creator' | 'comments_count'>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()
    
    if (error) throw error
    return data as Task
  },

  // Actualizar tarea
  async updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Task
  },

  // Obtener comentarios de una tarea
  async getComments(taskId: string) {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        author:members!author_id(*)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
      
    if (error) throw error
    return data as TaskComment[]
  },

  // Añadir un comentario
  async addComment(comment: Omit<TaskComment, 'id' | 'created_at' | 'updated_at' | 'author'>) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert(comment)
      .select()
      .single()
      
    if (error) throw error
    return data as TaskComment
  },

  // Editar un comentario
  async updateComment(id: string, content: string) {
    const { data, error } = await supabase
      .from('task_comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return data as TaskComment
  }
}
