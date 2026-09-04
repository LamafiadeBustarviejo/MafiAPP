import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { suggestionsService } from '@/services/suggestions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Plus, Mailbox, UserCircle2 } from 'lucide-react'

export function SuggestionsList() {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: suggestionsService.getSuggestions
  })

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
            <Mailbox className="w-8 h-8 text-purple-500" />
            Buzón de Sugerencias
          </h1>
          <p className="text-zinc-400">Publica tus ideas y propuestas para mejorar la peña.</p>
        </div>
        
        <Link to="/suggestions/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Nueva sugerencia
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      ) : suggestions?.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
          <Mailbox className="w-12 h-12 text-zinc-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-zinc-300">Aún no hay sugerencias</h3>
          <p className="text-zinc-500 mt-1">Sé el primero en proponer una idea genial.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions?.map(suggestion => (
            <Link key={suggestion.id} to={`/suggestions/${suggestion.id}`} className="block group">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition-colors shadow-sm hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors">
                        {suggestion.title}
                      </h3>
                      <p className="text-zinc-400 text-sm line-clamp-2">
                        {suggestion.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0">
                      <div className="flex items-center gap-2 text-sm">
                        {suggestion.is_anonymous ? (
                          <span className="flex items-center text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                            👤 Anónimo
                          </span>
                        ) : (
                          <span className="flex items-center text-zinc-300 bg-zinc-800 px-2 py-1 rounded-md">
                            <UserCircle2 className="w-4 h-4 mr-1 text-purple-400" />
                            {suggestion.creator?.nickname}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-zinc-500 text-sm gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{suggestion.comments_count?.[0]?.count || 0} comentarios</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
