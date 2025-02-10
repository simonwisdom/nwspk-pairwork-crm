'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AddPairworkButtonProps {
  userId: string
  currentUserId: string
}

export default function AddPairworkButton({ userId, currentUserId }: AddPairworkButtonProps) {
  const [showDateInput, setShowDateInput] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!scheduledAt) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('meetings')
        .insert([
          {
            organizer_id: currentUserId,
            participant_id: userId,
            scheduled_at: `${scheduledAt}T12:00:00.000Z`
          }
        ])

      if (error) throw error

      // Reset state and refresh the page
      setShowDateInput(false)
      setScheduledAt('')
      router.refresh()
    } catch (error) {
      console.error('Error adding pairwork session:', error)
      alert('Failed to add pairwork session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (showDateInput) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !scheduledAt}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Save'}
        </button>
        <button
          onClick={() => setShowDateInput(false)}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowDateInput(true)}
      className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      Add Pairwork
    </button>
  )
} 