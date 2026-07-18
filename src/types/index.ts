export interface Role {
  id: string
  name: string
  description: string | null
}

export interface Profile {
  id: string
  email: string
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  profile_id: string
  nickname: string
  role_id: string
  status: 'active' | 'inactive' | 'banned'
  join_date: string
  created_at: string
  updated_at: string
  
  // Relaciones
  profile?: Profile
  role?: Role
}

export interface InventoryCategory {
  id: string
  name: string
  icon: string | null
}

export type InventoryStatus = 'available' | 'borrowed' | 'in_use' | 'broken' | 'lost' | 'archived'

export interface InventoryItem {
  id: string
  category_id: string
  name: string
  description: string | null
  status: InventoryStatus
  owner_id: string | null
  location: string | null
  quantity: number
  event: string | null
  created_at: string
  updated_at: string
  
  // Relations
  category?: InventoryCategory
  owner?: Member
}

export interface InventoryMovement {
  id: string
  item_id: string
  previous_status: InventoryStatus | null
  new_status: InventoryStatus | null
  previous_owner_id: string | null
  new_owner_id: string | null
  notes: string | null
  created_by: string
  created_at: string
  
  // Relations
  created_by_member?: Member
  previous_owner?: Member
  new_owner?: Member
}

// ---------------------------
// TASKS MODULE
// ---------------------------

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'archived'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description: string | null
  assignee_id: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  event: string | null
  created_by: string
  created_at: string
  updated_at: string
  
  // Relations
  assignee?: Member
  creator?: Member
  comments_count?: [{ count: number }]
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string | null
  
  // Relations
  author?: Member
}

// ---------------------------
// FINANCES MODULE
// ---------------------------

export type FinanceType = 'income' | 'expense' | 'fee' | 'compensation'
export type FinanceStatus = 'pending' | 'completed' | 'cancelled'

export interface FinanceMovement {
  id: string
  type: FinanceType
  amount: number
  concept: string
  category: string
  date: string
  member_id: string | null
  event: string | null
  created_by: string
  status: FinanceStatus
  created_at: string
  updated_at: string
  
  // Relations
  member?: Member
  creator?: Member
  attachments?: FinanceAttachment[]
}

export interface FinanceAttachment {
  id: string
  movement_id: string
  file_url: string
  uploaded_by: string
  created_at: string
  
  // Relations
  uploader?: Member
}

// ==========================================
// 7. NOTIFICATIONS & ALERTS
// ==========================================

export interface AppNotification {
  id: string
  user_id: string
  title: string
  body: string
  type: string
  read: boolean
  created_at: string
}

export interface EmergencyAlert {
  id: string
  message: string
  reported_by: string
  status: 'active' | 'resolved'
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  
  // Relations
  reporter?: Member
  resolver?: Member
}
