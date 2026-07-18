import { Card, CardContent } from '@/components/ui/card'
import type { FinanceMovement } from '@/types'
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'

interface FinanceSummaryProps {
  movements: FinanceMovement[]
}

export function FinanceSummary({ movements }: FinanceSummaryProps) {
  // Solo sumamos los movimientos que NO estén cancelados
  const activeMovements = movements.filter(m => m.status !== 'cancelled')
  
  const incomes = activeMovements
    .filter(m => m.type === 'income' || m.type === 'fee')
    .reduce((sum, m) => sum + m.amount, 0)
    
  const expenses = activeMovements
    .filter(m => m.type === 'expense')
    .reduce((sum, m) => sum + m.amount, 0)
    
  const balance = incomes - expenses

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400 font-medium mb-1">Saldo Actual</p>
            <h2 className={`text-2xl font-bold ${balance >= 0 ? 'text-zinc-100' : 'text-red-500'}`}>
              {balance.toFixed(2)} €
            </h2>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400 font-medium mb-1">Ingresos y Cuotas</p>
            <h2 className="text-2xl font-bold text-emerald-500">
              +{incomes.toFixed(2)} €
            </h2>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6 text-emerald-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400 font-medium mb-1">Gastos</p>
            <h2 className="text-2xl font-bold text-red-500">
              -{expenses.toFixed(2)} €
            </h2>
          </div>
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <ArrowDownRight className="h-6 w-6 text-red-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
