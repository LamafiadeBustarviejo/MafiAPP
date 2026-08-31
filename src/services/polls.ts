import { supabase } from '@/lib/supabase'

export interface Poll {
  id: string
  title: string
  description: string | null
  status: 'active' | 'closed'
  created_at: string
  created_by: string
  options?: PollOption[]
  user_votes?: any[]
}

export interface PollOption {
  id: string
  poll_id: string
  text: string
  votes?: { count: number }[]
}

export interface PollVote {
  id: string
  poll_id: string
  option_id: string
  member_id: string
  created_at: string
}

export const pollsService = {
  async getActivePolls() {
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        options:poll_options(
          *,
          votes:poll_votes(count)
        ),
        user_votes:poll_votes(
          option_id, 
          member_id,
          profiles(members(nickname))
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Poll[]
  },

  async getPoll(id: string) {
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        options:poll_options(
          *,
          votes:poll_votes(count)
        ),
        user_votes:poll_votes(
          option_id, 
          member_id,
          profiles(members(nickname))
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Poll
  },

  async createPoll(title: string, description: string | null, options: string[], createdBy: string) {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({ title, description, created_by: createdBy })
      .select()
      .single()
    
    if (pollError) throw pollError

    const optionsData = options.map(text => ({ poll_id: poll.id, text }))
    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData)
    
    if (optionsError) throw optionsError

    return poll
  },

  async vote(pollId: string, optionId: string, memberId: string) {
    await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('member_id', memberId)

    const { error } = await supabase
      .from('poll_votes')
      .insert({ poll_id: pollId, option_id: optionId, member_id: memberId })
    
    if (error) throw error
    return true
  },

  async closePoll(pollId: string) {
    const { error } = await supabase
      .from('polls')
      .update({ status: 'closed' })
      .eq('id', pollId)
    
    if (error) throw error
    return true
  }
}
