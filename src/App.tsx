import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { UpdatePassword } from '@/pages/UpdatePassword'
import { Dashboard } from '@/pages/Dashboard'
import { InventoryList } from '@/pages/InventoryList'
import { InventoryDetail } from '@/pages/InventoryDetail'
import { InventoryForm } from '@/pages/InventoryForm'
import { TasksList } from '@/pages/TasksList'
import { TaskDetail } from '@/pages/TaskDetail'
import { TaskForm } from '@/pages/TaskForm'
import { PostersBoard } from '@/pages/PostersBoard'
import { PollsList } from '@/pages/PollsList'
import { MembersList } from '@/pages/MembersList'
import { FinancesList } from '@/pages/FinancesList'
import { FinanceDetail } from '@/pages/FinanceDetail'
import { FinanceForm } from '@/pages/FinanceForm'
import { HistoryList } from '@/pages/HistoryList'
import { Events } from '@/pages/Events'
import { Agenda } from '@/pages/Agenda'
import { SuggestionsList } from '@/pages/SuggestionsList'
import { SuggestionForm } from '@/pages/SuggestionForm'
import { SuggestionDetail } from '@/pages/SuggestionDetail'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/agenda" element={<Agenda />} />
            
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              {/* Inventory Routes */}
              <Route path="/inventory" element={<InventoryList />} />
              <Route path="/inventory/new" element={<InventoryForm />} />
              <Route path="/inventory/:id" element={<InventoryDetail />} />
              <Route path="/inventory/:id/edit" element={<InventoryForm />} />
              {/* Tasks Routes */}
              <Route path="/tasks" element={<TasksList />} />
              <Route path="/tasks/new" element={<TaskForm />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/tasks/:id/edit" element={<TaskForm />} />
              {/* Members Route */}
              <Route path="/members" element={<MembersList />} />
              {/* Suggestions Routes */}
              <Route path="/suggestions" element={<SuggestionsList />} />
              <Route path="/suggestions/new" element={<SuggestionForm />} />
              <Route path="/suggestions/:id" element={<SuggestionDetail />} />
              {/* Finances Routes */}
              <Route path="/finances" element={<FinancesList />} />
              <Route path="/finances/new" element={<FinanceForm />} />
              <Route path="/finances/:id" element={<FinanceDetail />} />
              <Route path="/finances/:id/edit" element={<FinanceForm />} />
              {/* Events Route */}
              <Route path="/events" element={<Events />} />
              {/* Posters Route */}
              <Route path="/posters" element={<PostersBoard />} />
              <Route path="/polls" element={<PollsList />} />
              {/* History Route (Protected internally) */}
              <Route path="/history" element={<HistoryList />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
