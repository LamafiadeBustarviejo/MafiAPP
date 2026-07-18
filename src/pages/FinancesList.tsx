import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financesService } from '@/services/finances'
import { FinanceCard } from '@/features/finances/FinanceCard'
import { FinanceSummary } from '@/features/finances/FinanceSummary'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Plus, ArrowRightLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export function FinancesList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data: movements, isLoading, error } = useQuery({
    queryKey: ['finances'],
    queryFn: financesService.getMovements
  })

  // Filter movements
  const filteredMovements = movements?.filter(m => {
    if (!debouncedSearch) return true
    const s = debouncedSearch.toLowerCase()
    return (
      m.concept.toLowerCase().includes(s) || 
      m.category.toLowerCase().includes(s) ||
      (m.member && m.member.nickname.toLowerCase().includes(s))
    )
  })

  if (error) return <div className="p-4 text-center text-red-500">Error al cargar: {(error as Error).message}</div>

  return (
    <div className="p-4 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-emerald-500" />
            Finanzas y Tesorería
          </h1>
          <p className="text-sm text-zinc-400">Control de ingresos, gastos y cuotas de la peña.</p>
        </div>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Buscar tickets..." 
              className="pl-9 bg-zinc-900/50 border-zinc-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/finances/new">
            <Button className="bg-red-800 hover:bg-red-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Agregar Movimiento</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-20">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>
        ) : !movements?.length ? (
          <div className="text-center p-12 border border-dashed border-zinc-800 rounded-lg text-zinc-400">
            No hay ningún movimiento financiero registrado.
          </div>
        ) : (
          <>
            <FinanceSummary movements={movements} />
            
            <div className="space-y-0 rounded-xl overflow-hidden border border-zinc-800/50">
              {filteredMovements?.map(movement => (
                <FinanceCard 
                  key={movement.id} 
                  movement={movement} 
                  onClick={() => navigate(`/finances/${movement.id}`)}
                />
              ))}
              
              {filteredMovements?.length === 0 && (
                <div className="text-center p-8 text-zinc-500">No se encontraron movimientos con esa búsqueda.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
