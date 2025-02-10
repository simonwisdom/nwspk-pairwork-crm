'use client'

import { useState } from 'react'
import { format, isPast } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Edit2, Trash2, X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MeetingItemProps {
  meeting: {
    id: string
    scheduled_at: string
    summary?: string | null
  }
  isOrganizer: boolean
}

export default function MeetingItem({ meeting, isOrganizer }: MeetingItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newDate, setNewDate] = useState(meeting.scheduled_at.split('T')[0])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this pairwork session?')) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meeting.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error deleting pairwork session:', error)
      alert('Failed to delete pairwork session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('meetings')
        .update({
          scheduled_at: `${newDate}T12:00:00.000Z`
        })
        .eq('id', meeting.id)

      if (error) throw error

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating pairwork session:', error)
      alert('Failed to update pairwork session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <li className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="input-primary"
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-full p-1 text-[#17BEBB] hover:bg-[#E1F7F7]"
              title="Save changes"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="rounded-full p-1 text-[#EF3E36] hover:bg-[#E1F7F7]"
              title="Cancel editing"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </li>
    )
  }

  const meetingDate = new Date(meeting.scheduled_at)
  const hasPassed = isPast(meetingDate)

  return (
    <li className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${hasPassed ? 'text-[#2E282A]/60' : 'text-[#2E282A]'}`}>
            {format(meetingDate, 'PPP')}
          </p>
        </div>
        {isOrganizer && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              disabled={loading}
              className="rounded-full p-1 text-[#2E282A]/40 hover:text-[#17BEBB] hover:bg-[#E1F7F7]"
              title="Edit pairwork date"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-full p-1 text-[#2E282A]/40 hover:text-[#EF3E36] hover:bg-[#E1F7F7]"
              title="Delete pairwork session"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {meeting.summary && (
        <p className="mt-2 text-sm text-[#2E282A]/60">{meeting.summary}</p>
      )}
    </li>
  )
} 