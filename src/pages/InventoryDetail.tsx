import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { inventoryService } from '@/services/inventory'
import { StatusBadge } from '@/features/inventory/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Edit2, MapPin, Hash, User2, AlignLeft, CalendarClock } from 'lucide-react'

export function InventoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryService.getItem(id!)
  })

  const { data: movements, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['inventory-movements', id],
    queryFn: () => inventoryService.getItemMovements(id!)
  })

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
  }

  if (error || !item) {
    return <div className="p-4 text-center text-red-500">Error al cargar el artículo.</div>
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="text-zinc-400">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/inventory/${id}/edit`)}>
          <Edit2 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3 border-b border-zinc-800/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{item.name}</CardTitle>
                </div>
                <StatusBadge status={item.status} className="text-sm px-3 py-1" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-zinc-400">
                    <Hash className="w-4 h-4 mr-1.5" /> Cantidad
                  </div>
                  <div className="font-medium text-zinc-100">{item.quantity} unid.</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-zinc-400">
                    <User2 className="w-4 h-4 mr-1.5" /> Propietario
                  </div>
                  <div className="font-medium text-zinc-100">{item.owner?.nickname || 'Sin asignar'}</div>
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="flex items-center text-sm text-zinc-400">
                    <MapPin className="w-4 h-4 mr-1.5" /> Ubicación
                  </div>
                  <div className="font-medium text-zinc-100">{item.location || 'No especificada'}</div>
                </div>
              </div>

              {item.description && (
                <div className="pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center text-sm text-zinc-400 mb-2">
                    <AlignLeft className="w-4 h-4 mr-1.5" /> Notas / Descripción
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{item.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline / Movements */}
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <CalendarClock className="w-5 h-5 mr-2 text-zinc-400" />
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMovements ? (
                <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
              ) : !movements?.length ? (
                <p className="text-sm text-zinc-500 text-center py-4">No hay movimientos registrados.</p>
              ) : (
                <div className="relative border-l border-zinc-800 ml-3 space-y-6">
                  {movements.map(mov => (
                    <div key={mov.id} className="relative pl-6">
                      {/* Timeline dot */}
                      <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-zinc-700 border-2 border-zinc-900" />
                      
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 font-medium mb-1">
                          {new Date(mov.created_at).toLocaleDateString()} a las {new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        <p className="text-sm text-zinc-300">
                          <span className="font-medium text-zinc-100">{mov.created_by_member?.nickname}</span> actualizó el objeto.
                        </p>
                        
                        {mov.new_status && mov.new_status !== mov.previous_status && (
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="text-zinc-500">Estado:</span>
                            <StatusBadge status={mov.new_status} className="scale-75 origin-left" />
                          </div>
                        )}
                        
                        {mov.notes && (
                          <p className="mt-2 text-xs text-zinc-400 italic bg-zinc-800/50 p-2 rounded">
                            "{mov.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
