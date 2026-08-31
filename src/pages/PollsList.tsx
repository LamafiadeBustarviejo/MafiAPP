import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pollsService, type Poll } from '@/services/polls'
import { membersService } from '@/services/members'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, PieChart, CheckCircle2, Loader2, X } from 'lucide-react'

export function PollsList() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newOptions, setNewOptions] = useState(['', ''])

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', session?.user.id],
    queryFn: () => membersService.getCurrentMember(session!.user.id),
    enabled: !!session?.user.id
  })

  const { data: polls, isLoading } = useQuery({
    queryKey: ['active-polls'],
    queryFn: pollsService.getActivePolls
  })

  const createPollMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error('Usuario no autenticado')
      const filteredOptions = newOptions.filter(o => o.trim() !== '')
      if (filteredOptions.length < 2) throw new Error('Se necesitan al menos 2 opciones')
      if (!newTitle.trim()) throw new Error('El título es obligatorio')

      return pollsService.createPoll(newTitle, newDescription, filteredOptions, session.user.id)
    },
    onSuccess: () => {
      setIsCreating(false)
      setNewTitle('')
      setNewDescription('')
      setNewOptions(['', ''])
      queryClient.invalidateQueries({ queryKey: ['active-polls'] })
    }
  })

  const closePollMutation = useMutation({
    mutationFn: (pollId: string) => pollsService.closePoll(pollId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-polls'] })
  })

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string, optionId: string }) => {
      if (!session?.user?.id) throw new Error('No autenticado')
      return pollsService.vote(pollId, optionId, session.user.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-polls'] })
  })

  const addOption = () => setNewOptions([...newOptions, ''])
  const updateOption = (index: number, value: string) => {
    const newArr = [...newOptions]
    newArr[index] = value
    setNewOptions(newArr)
  }
  const removeOption = (index: number) => {
    if (newOptions.length <= 2) return
    const newArr = [...newOptions]
    newArr.splice(index, 1)
    setNewOptions(newArr)
  }

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <PieChart className="h-8 w-8 text-indigo-500" />
            Encuestas
          </h1>
          <p className="text-zinc-400 mt-2">Votaciones y decisiones de la peña</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Nueva Encuesta
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="bg-zinc-950 border-indigo-900/50 mb-8">
          <CardHeader>
            <CardTitle className="text-indigo-400">Crear Nueva Encuesta</CardTitle>
            <CardDescription>Abre una votación para que decida la peña.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pregunta o Título</Label>
              <Input 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="¿Qué comemos el sábado de las fiestas?" 
                className="bg-zinc-900 border-zinc-800 text-zinc-100" 
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Input 
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Explicación adicional..." 
                className="bg-zinc-900 border-zinc-800 text-zinc-100" 
              />
            </div>
            <div className="space-y-3">
              <Label>Opciones</Label>
              {newOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Opción ${i + 1}`} 
                    className="bg-zinc-900 border-zinc-800 text-zinc-100" 
                  />
                  {newOptions.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(i)} className="text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addOption} className="w-full mt-2 bg-zinc-900 border-zinc-800">
                <Plus className="w-4 h-4 mr-2" /> Añadir Opción
              </Button>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button 
                onClick={() => createPollMutation.mutate()} 
                disabled={createPollMutation.isPending || !newTitle.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createPollMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Publicar Encuesta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {polls?.length === 0 && !isCreating && (
          <div className="text-center p-12 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <PieChart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">No hay encuestas activas en este momento.</p>
          </div>
        )}

        {polls?.map(poll => {
          const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes?.[0]?.count || 0), 0) || 0
          const hasVoted = poll.user_votes?.some(v => v.member_id === session?.user?.id)
          const userVoteOptionId = poll.user_votes?.find(v => v.member_id === session?.user?.id)?.option_id
          const isAdmin = currentMember?.role?.name === 'admin'
          const isCreator = session?.user?.id === poll.created_by

          return (
            <Card key={poll.id} className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-zinc-100">{poll.title}</CardTitle>
                  {poll.description && <p className="text-sm text-zinc-400 mt-2">{poll.description}</p>}
                </div>
                {(isAdmin || isCreator) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => closePollMutation.mutate(poll.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4 mr-2" /> Cerrar Encuesta
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {poll.options?.map((option) => {
                  const votes = option.votes?.[0]?.count || 0
                  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
                  const isSelected = userVoteOptionId === option.id
                  const votersForThisOption = poll.user_votes?.filter(v => v.option_id === option.id) || []

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
                              <span className={`font-medium ${isSelected ? 'text-indigo-400' : 'text-zinc-300'}`}>
                                {option.text}
                                {isSelected && <CheckCircle2 className="w-4 h-4 inline ml-2" />}
                              </span>
                              <span className="font-bold text-zinc-400">{percentage}% ({votes})</span>
                            </div>
                          </div>
                          {votersForThisOption.length > 0 && (
                            <div className="text-xs text-zinc-500 px-2 leading-relaxed">
                              Votado por: {votersForThisOption.map((v: any) => v.profiles?.members?.[0]?.nickname || 'Desconocido').join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button 
                          variant="outline"
                          className="w-full justify-start h-auto py-3 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-indigo-400 text-left whitespace-normal"
                          onClick={() => voteMutation.mutate({ pollId: poll.id, optionId: option.id })}
                          disabled={voteMutation.isPending}
                        >
                          {voteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          <span className="text-base font-normal">{option.text}</span>
                        </Button>
                      )}
                    </div>
                  )
                })}
                <div className="pt-2 text-xs text-zinc-500 text-right">
                  Total de votos: {totalVotes}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
