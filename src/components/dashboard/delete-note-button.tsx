'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteNoteButtonProps {
  noteId: string
}

export default function DeleteNoteButton({ noteId }: DeleteNoteButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="ml-4 p-1 text-gray-400 hover:text-[#EF3E36] rounded-full hover:bg-[#FAD8D6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EF3E36]"
      title="Delete note"
    >
      <span className="sr-only">Delete note</span>
      <Trash2 className="h-4 w-4" />
    </button>
  )
} 