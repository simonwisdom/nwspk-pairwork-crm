'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AddNoteFormProps {
  userId: string
  contactId: string
}

export default function AddNoteForm({ userId, contactId }: AddNoteFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: supabaseError } = await supabase
        .from('notes')
        .insert([
          {
            user_id: userId,
            contact_id: contactId,
            content: content.trim(),
          },
        ])

      if (supabaseError) throw supabaseError

      setContent('')
      router.refresh()
    } catch (error) {
      console.error('Error adding note:', error)
      setError(error instanceof Error ? error.message : 'Failed to add note. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      <div>
        <label htmlFor="content" className="sr-only">
          Add a note
        </label>
        <textarea
          id="content"
          name="content"
          rows={3}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Note'}
        </button>
      </div>
    </form>
  )
} 