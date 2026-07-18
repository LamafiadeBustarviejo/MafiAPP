import type { TaskComment } from '@/types'
import { useState } from 'react'
import { Edit2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CommentBubbleProps {
  comment: TaskComment
  isOwnComment: boolean
  onEdit: (id: string, newContent: string) => void
}

export function CommentBubble({ comment, isOwnComment, onEdit }: CommentBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const handleSave = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent)
    }
    setIsEditing(false)
  }

  const isEdited = comment.updated_at !== null

  return (
    <div className={`flex flex-col ${isOwnComment ? 'items-end' : 'items-start'} mb-4`}>
      <div className="flex items-baseline gap-2 mb-1 px-1">
        <span className="text-xs font-semibold text-zinc-300">
          {comment.author?.nickname || 'Usuario'}
        </span>
        <span className="text-[10px] text-zinc-500">
          {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isEdited && (
          <span className="text-[10px] text-zinc-500 italic">(editado)</span>
        )}
      </div>

      <div className={`relative group max-w-[85%] rounded-2xl p-3 text-sm ${
        isOwnComment 
          ? 'bg-red-900/40 text-zinc-100 rounded-tr-none' 
          : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
      }`}>
        {isEditing ? (
          <div className="space-y-2 min-w-[200px]">
            <textarea
              className="w-full bg-zinc-950/50 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setIsEditing(false)}>
                <X className="w-3 h-3 mr-1" /> Cancelar
              </Button>
              <Button size="sm" className="h-6 px-2 text-xs bg-red-800 hover:bg-red-700" onClick={handleSave}>
                <Save className="w-3 h-3 mr-1" /> Guardar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{comment.content}</p>
            {isOwnComment && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-zinc-900 rounded-md text-zinc-400 hover:text-white"
                title="Editar comentario"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
