import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventoryService } from '@/services/inventory'
import { InventoryCard } from '@/features/inventory/InventoryCard'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Search, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/features/inventory/StatusBadge'

export function InventoryList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.getItems
  })

  // Filter items based on search term
  const filteredItems = items?.filter(item => 
    item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.owner?.nickname.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error al cargar el inventario: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Inventario</h1>
          <p className="text-sm text-zinc-400">Gestiona los objetos y materiales de la peña.</p>
        </div>
        <Button onClick={() => navigate('/inventory/new')} className="w-full sm:w-auto bg-red-800 hover:bg-red-700 text-white gap-2">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Artículo
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input 
          placeholder="Buscar artículos..." 
          className="pl-9 bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List / Grid */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : filteredItems?.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-400">No se encontraron artículos.</p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-0 rounded-xl overflow-hidden border border-zinc-800/50 flex flex-col">
            {filteredItems?.map(item => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 bg-zinc-900/50 uppercase border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3 text-right">Cant.</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems?.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => navigate(`/inventory/${item.id}`)}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-100">{item.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 text-zinc-400">{item.location || '-'}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
