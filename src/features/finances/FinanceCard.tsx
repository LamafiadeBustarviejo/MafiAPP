import { Card, CardContent } from '@/components/ui/card'
import type { FinanceMovement } from '@/types'
import { ArrowDownRight, ArrowUpRight, Banknote, Receipt, MessageSquare } from 'lucide-react'

interface FinanceCardProps {
  movement: FinanceMovement
  onClick?: () => void
}

export function FinanceCard({ movement, onClick }: FinanceCardProps) {
  const isIncome = movement.type === 'income' || movement.type === 'fee'
  const isFee = movement.type === 'fee'
  const hasAttachments = movement.attachments && movement.attachments.length > 0
  
  return (
    <Card 
      className="bg-zinc-900 transition-colors cursor-pointer active:scale-[0.98] rounded-none border-x-0 border-t-0 first:border-t border-b-zinc-800 hover:bg-zinc-800/50"
      onClick={onClick}
    >
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
            isFee ? 'bg-indigo-950/50 text-indigo-500' :
            isIncome ? 'bg-emerald-950/50 text-emerald-500' : 
            'bg-red-950/50 text-red-500'
          }`}>
            {isFee ? <Banknote className="h-4 w-4" /> :
             isIncome ? <ArrowUpRight className="h-4 w-4" /> : 
             <ArrowDownRight className="h-4 w-4" />}
          </div>
          
          {/* Info */}
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm line-clamp-1">{movement.concept}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span className="capitalize">{movement.category}</span>
              <span>•</span>
              <span>{new Date(movement.date).toLocaleDateString()}</span>
              {isFee && movement.member && (
                <>
                  <span>•</span>
                  <span className="text-indigo-400 truncate max-w-[80px]">{movement.member.nickname}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Amount & Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`font-bold ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>
            {isIncome ? '+' : '-'}{movement.amount.toFixed(2)} €
          </span>
          <div className="flex gap-1.5">
            {hasAttachments && <Receipt className="h-3.5 w-3.5 text-zinc-500" title="Justificante adjunto" />}
            {movement.status === 'cancelled' && <span className="text-[10px] bg-red-950 text-red-500 px-1.5 rounded uppercase font-bold">Anulado</span>}
          </div>
        </div>
      </div>
    </Card>
  )
}
