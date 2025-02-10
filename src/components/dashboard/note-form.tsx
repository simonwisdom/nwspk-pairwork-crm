'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NoteImageUpload from './note-image-upload'

interface NoteFormProps {
  userId: string
  contactId: string
  meetingId?: string
}

interface NoteData {
  user_id: string
  contact_id: string
  content: string
  image_url: string | null
  meeting_id?: string
}

export default function NoteForm({ userId, contactId, meetingId }: NoteFormProps) {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Log the authenticated user for debugging
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Prepare note data
      const noteData: NoteData = {
        user_id: userId,
        contact_id: contactId,
        content: content.trim(),
        image_url: imageUrl || null
      }

      // Add meeting_id if provided
      if (meetingId) {
        noteData.meeting_id = meetingId
      }

      const { error } = await supabase
        .from('notes')
        .insert([noteData])
        .select()

      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Failed to add note: ${error.message}`)
      }

      // Reset form and refresh the page
      setContent('')
      setImageUrl('')
      router.refresh()
    } catch (error) {
      console.error('Error details:', error)
      alert(error instanceof Error ? error.message : 'Failed to add note. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="block w-full rounded-lg border-2 border-[#17BEBB] p-4 text-base resize-none focus:outline-none focus:ring-0 focus:border-[#17BEBB] text-[#2E282A] placeholder-gray-400"
        rows={4}
        placeholder="Add a note..."
        required
      />
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <NoteImageUpload
          key={imageUrl}
          onImageUploaded={setImageUrl}
          existingImageUrl={imageUrl}
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="btn-primary"
        >
          {loading ? 'Adding...' : 'Add Note'}
        </button>
      </div>
    </form>
  )
} 