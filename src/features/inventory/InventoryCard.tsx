import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import type { InventoryItem } from '@/types'
import { Box, Wrench, GlassWater, Hash, MapPin, User2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface InventoryCardProps {
  item: InventoryItem
}

export function InventoryCard({ item }: InventoryCardProps) {
  const navigate = useNavigate()
  
  // Icon mapping based on category name (simplified logic for V1)
  const getIcon = () => {
    return <Box className="h-5 w-5 text-zinc-400" />
  }

  return (
    <Card 
      className="bg-zinc-900 transition-colors cursor-pointer active:scale-[0.98] rounded-none border-x-0 border-t-0 first:border-t border-b-zinc-800 hover:bg-zinc-800/50"
      onClick={() => navigate(`/inventory/${item.id}`)}
    >
      <div className="p-3 flex items-center justify-between gap-3">
        {/* Main Info */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="bg-zinc-800 p-2 rounded-lg shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-100 truncate text-sm leading-tight">{item.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                <span>{item.quantity} ud.</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{item.location || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={item.status} className="scale-90 origin-right" />
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <User2 className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{item.owner?.nickname || 'Sin asignar'}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
