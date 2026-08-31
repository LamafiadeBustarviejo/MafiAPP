import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pollsService, type Poll, type PollOption } from '@/services/polls'
import { membersService } from '@/services/members'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, PieChart, CheckCircle2 } from 'lucide-react'

export function PollWidget() {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => membersService.getCurrentMember(session!.user.id),
    enabled: !!session?.user.id
  })

  const { data: polls, isLoading } = useQuery({
    queryKey: ['active-polls'],
    queryFn: pollsService.getActivePolls
  })

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string, optionId: string }) => {
      if (!session?.user?.id) throw new Error('No autenticado')
      return pollsService.vote(pollId, optionId, session.user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-polls'] })
    }
  })

  if (isLoading) return null
  if (!polls || polls.length === 0) return null

  // Mostrar la última encuesta activa en el widget
  const poll = polls[0]
  const hasVoted = poll.user_votes?.some(v => v.member_id === session?.user?.id)
  const userVoteOptionId = poll.user_votes?.find(v => v.member_id === session?.user?.id)?.option_id

  const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes?.[0]?.count || 0), 0) || 0

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <PieChart className="w-5 h-5 text-indigo-400" />
          </div>
          Encuesta Abierta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium text-zinc-200">{poll.title}</h3>
          {poll.description && <p className="text-sm text-zinc-400 mt-1">{poll.description}</p>}
        </div>

        <div className="space-y-2">
          {poll.options?.map((option) => {
            const votes = option.votes?.[0]?.count || 0
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
            const isSelected = userVoteOptionId === option.id
            const votersForThisOption = poll.user_votes?.filter((v: any) => v.option_id === option.id) || []

            return (
              <div key={option.id} className="relative">
                {hasVoted ? (
                  <div className="space-y-1">
                    <div 
                      onClick={() => {
                        if (!isSelected) voteMutation.mutate({ pollId: poll.id, optionId: option.id })
                      }}
                      className={`relative overflow-hidden rounded-lg bg-zinc-900 border p-3 cursor-pointer transition-colors
                        ${isSelected ? 'border-indigo-500/50' : 'border-zinc-800 hover:border-zinc-600'}
                      `}
                    >
                      <div 
                        className="absolute top-0 left-0 bottom-0 bg-indigo-600/20 transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative flex items-center justify-between z-10">
                        <span className={`text-sm font-medium ${isSelected ? 'text-indigo-400' : 'text-zinc-300'}`}>
                          {option.text}
                          {isSelected && <CheckCircle2 className="w-4 h-4 inline ml-2" />}
                        </span>
                        <span className="text-sm font-bold text-zinc-400">{percentage}% ({votes})</span>
                      </div>
                    </div>
                    {votersForThisOption.length > 0 && (
                      <div className="text-xs text-zinc-500 px-2">
                        {votersForThisOption.map((v: any) => v.profiles?.members?.[0]?.nickname || 'Desconocido').join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-indigo-400"
                    onClick={() => voteMutation.mutate({ pollId: poll.id, optionId: option.id })}
                    disabled={voteMutation.isPending}
                  >
                    {voteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {option.text}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
        
        {hasVoted && (
          <p className="text-xs text-center text-emerald-500 font-medium pt-2">
            ¡Gracias por votar!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
