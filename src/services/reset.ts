import { supabase } from '@/lib/supabase'

export const resetService = {
  /**
   * Resets the application data for a new year/season.
   * - Resets all tasks to 'pending' and removes assignments
   * - Deletes all financial movements
   * Note: Inventory remains untouched.
   */
  async resetNewYear() {
    try {
      // 1. Reset tasks: set status to 'pending', assigned_to to null
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ status: 'pending', assigned_to: null })
        .neq('status', 'placeholder_to_update_all_rows') // A dummy condition to allow bulk update

      if (tasksError) throw new Error(`Error resetting tasks: ${tasksError.message}`)

      // 2. Delete all finances
      const { error: financesError } = await supabase
        .from('financial_movements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // A dummy condition to allow bulk delete

      if (financesError) throw new Error(`Error deleting finances: ${financesError.message}`)

      return true
    } catch (error) {
      console.error("Error during reset:", error)
      throw error
    }
  }
}
