'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ScheduleMeetingButtonProps {
  userId: string
  currentUserId: string
  meetingLink?: string | null
}

export default function ScheduleMeetingButton({ userId, currentUserId, meetingLink }: ScheduleMeetingButtonProps) {
  const [showDateInput, setShowDateInput] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSchedule = async () => {
    if (!meetingLink) {
      alert('This user has not set up their meeting link yet.')
      return
    }

    // Open meeting link in new tab
    window.open(meetingLink, '_blank')
    // Show date input after opening link
    setShowDateInput(true)
  }

  const handleSubmitDate = async () => {
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
            scheduled_at: `${scheduledAt}T12:00:00.000Z`, // Set default time to noon UTC
            status: 'scheduled'
          }
        ])

      if (error) throw error

      // Reset state and refresh the page
      setShowDateInput(false)
      setScheduledAt('')
      router.refresh()
    } catch (error) {
      console.error('Error scheduling meeting:', error)
      alert('Failed to schedule meeting. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (showDateInput) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="w-full text-right">
          <label htmlFor="scheduledAt" className="block text-sm text-gray-700 mb-1">
            When did you schedule your pairwork?
          </label>
          <div className="flex items-center gap-2">
            <input
              id="scheduledAt"
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
            <button
              onClick={handleSubmitDate}
              disabled={loading || !scheduledAt}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowDateInput(false)}
              disabled={loading}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleSchedule}
      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
      disabled={!meetingLink}
      title={!meetingLink ? 'User has not set up their meeting link' : undefined}
    >
      Schedule Pairwork
    </button>
  )
} 