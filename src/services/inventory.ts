import { supabase } from '@/lib/supabase'
import type { InventoryItem, InventoryCategory, InventoryMovement } from '@/types'

export const inventoryService = {
  // Fetch all items with relations
  async getItems() {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(*),
        owner:members(*)
      `)
      .order('name')
    
    if (error) throw error
    return data as InventoryItem[]
  },

  // Fetch a single item by ID
  async getItem(id: string) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(*),
        owner:members(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as InventoryItem
  },

  // Fetch categories
  async getCategories() {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as InventoryCategory[]
  },

  // Create new item
  async createItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'category' | 'owner'>) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single()
    
    if (error) throw error
    return data as InventoryItem
  },

  // Update item
  async updateItem(id: string, updates: Partial<InventoryItem>) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as InventoryItem
  },

  // Record a movement
  async recordMovement(movement: Omit<InventoryMovement, 'id' | 'created_at' | 'created_by_member' | 'previous_owner' | 'new_owner'>) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert(movement)
      .select()
      .single()
      
    if (error) throw error
    return data as InventoryMovement
  },
  
  // Get movements for an item
  async getItemMovements(itemId: string) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        created_by_member:members!created_by(*),
        previous_owner:members!previous_owner_id(*),
        new_owner:members!new_owner_id(*)
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data as InventoryMovement[]
  },
  
  // Get all members for selection dropdowns
  async getMembers() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('nickname')
      
    if (error) throw error
    return data
  }
}
