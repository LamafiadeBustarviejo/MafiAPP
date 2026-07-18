import { Badge } from '@/components/ui/badge'
import type { InventoryStatus } from '@/types'

const statusConfig: Record<InventoryStatus, { label: string, colorClass: string }> = {
  available: { label: 'Disponible', colorClass: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' },
  borrowed: { label: 'Prestado', colorClass: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' },
  in_use: { label: 'En uso', colorClass: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' },
  broken: { label: 'Dañado', colorClass: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
  lost: { label: 'Perdido', colorClass: 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20' },
  archived: { label: 'Descatalogado', colorClass: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-800' }
}

interface StatusBadgeProps {
  status: InventoryStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, colorClass: 'bg-zinc-500' }
  
  return (
    <Badge variant="outline" className={`border-0 font-medium ${config.colorClass} ${className || ''}`}>
      {config.label}
    </Badge>
  )
}
