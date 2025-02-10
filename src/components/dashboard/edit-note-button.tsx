'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Edit2, Check, X } from 'lucide-react'
import NoteImageUpload from './note-image-upload'

interface Note {
  id: string
  content: string
  image_url: string | null
}

interface EditNoteButtonProps {
  note: Note
}

export default function EditNoteButton({ note }: EditNoteButtonProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(note.content)
  const [imageUrl, setImageUrl] = useState(note.image_url)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!content.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notes')
        .update({
          content: content.trim(),
          image_url: imageUrl
        })
        .eq('id', note.id)

      if (error) throw error

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Failed to update note. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="block w-full rounded-lg border-2 border-[#17BEBB] p-4 text-base resize-none focus:outline-none focus:ring-0 focus:border-[#17BEBB] text-[#2E282A]"
          rows={4}
          placeholder="Edit note..."
          required
        />
        <div className="mt-4 flex items-center justify-between">
          <NoteImageUpload
            onImageUploaded={setImageUrl}
            existingImageUrl={imageUrl}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={loading || !content.trim()}
              className="rounded-full p-2 text-[#17BEBB] hover:bg-[#FAD8D6]"
              title="Save changes"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setContent(note.content)
                setImageUrl(note.image_url)
              }}
              disabled={loading}
              className="rounded-full p-2 text-[#EF3E36] hover:bg-[#FAD8D6]"
              title="Cancel editing"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="rounded-full p-1 text-gray-400 hover:text-[#17BEBB] hover:bg-[#FAD8D6]"
      title="Edit note"
    >
      <Edit2 className="h-4 w-4" />
    </button>
  )
} 