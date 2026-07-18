import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { historyService, type HistoryRecord } from '@/services/history'
import { membersService } from '@/services/members'
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, History, Database, User2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportService } from '@/services/export'
import { resetService } from '@/services/reset'
import { Download, AlertTriangle } from 'lucide-react'

const actionColors: Record<string, string> = {
  INSERT: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  UPDATE: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  DELETE: 'text-red-400 bg-red-400/10 border-red-400/20'
}

const actionTranslations: Record<string, string> = {
  INSERT: 'NUEVO',
  UPDATE: 'EDICIÓN',
  DELETE: 'BORRADO'
}

const tableTranslations: Record<string, string> = {
  members: 'Miembros',
  tasks: 'Tareas',
  inventory_items: 'Inventario',
  financial_movements: 'Finanzas',
  profiles: 'Perfiles',
  history: 'Historial',
  roles: 'Roles',
  task_comments: 'Comentarios de Tareas'
}

function HistoryDetails({ record }: { record: HistoryRecord }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2 text-xs">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 text-zinc-400 hover:text-white px-2"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
        {open ? 'Ocultar detalles' : 'Ver detalles técnicos'}
      </Button>
      
      {open && (
        <div className="mt-2 p-3 bg-zinc-950 rounded-md border border-zinc-800 space-y-3 font-mono">
          {record.old_data && (
            <div>
              <span className="text-red-400 mb-1 block">Datos Anteriores:</span>
              <pre className="text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(record.old_data, null, 2)}
              </pre>
            </div>
          )}
          {record.new_data && (
            <div>
              <span className="text-emerald-400 mb-1 block">Nuevos Datos:</span>
              <pre className="text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(record.new_data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function HistoryList() {
  const { session } = useAuth()
  const [isExporting, setIsExporting] = useState(false)
  const [hasExported, setHasExported] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  
  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportService.exportDatabaseToExcel()
      setHasExported(true)
    } catch (e) {
      alert("Error al exportar los datos")
    } finally {
      setIsExporting(false)
    }
  }

  const handleReset = async () => {
    const confirmText = prompt("Escribe 'REINICIAR' para confirmar el borrado de tareas y finanzas para el nuevo año.")
    if (confirmText !== 'REINICIAR') {
      if (confirmText !== null) alert("Operación cancelada. El texto no coincide.")
      return
    }

    setIsResetting(true)
    try {
      await resetService.resetNewYear()
      alert("¡El sistema ha sido reseteado para el nuevo año!")
      window.location.reload()
    } catch (e) {
      alert("Error al resetear los datos. Es posible que te falten permisos en la base de datos.")
    } finally {
      setIsResetting(false)
    }
  }
  
  const { data: member, isLoading: isLoadingMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => membersService.getCurrentMember(session!.user.id),
    enabled: !!session?.user.id
  })

  const isAdmin = member?.role?.name === 'admin' || member?.roles?.name === 'admin' || session?.user?.email === 'soyelcharly@gmail.com'

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['history'],
    queryFn: historyService.getHistory,
    enabled: !!isAdmin
  })

  if (isLoadingMember) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
  }

  // Protección estricta: si no es admin, fuera.
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <History className="w-6 h-6 text-red-500" />
            Registro Histórico
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Auditoría global de todos los cambios de la aplicación.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && hasExported && (
            <Button 
              onClick={handleReset}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-900/20"
            >
              {isResetting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              {isResetting ? 'Reseteando...' : 'Nuevo Año (Reset)'}
            </Button>
          )}

          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-900/20"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? 'Generando...' : 'Exportar a Excel'}
          </Button>
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="border-b border-zinc-800/50">
          <CardTitle className="text-lg">Últimos movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingHistory ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
          ) : history?.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No hay registros históricos.</div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {history?.map((record) => (
                <div key={record.id} className="p-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${actionColors[record.action] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                          {actionTranslations[record.action] || record.action}
                        </span>
                        <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-zinc-500" />
                          {tableTranslations[record.table_name] || record.table_name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <User2 className="w-4 h-4" />
                          {record.author?.nickname || 'Sistema / Desconocido'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {new Date(record.performed_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <HistoryDetails record={record} />
                    </div>

                    <div className="text-xs text-zinc-500 font-mono self-start md:text-right">
                      ID: {record.record_id.split('-')[0]}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
