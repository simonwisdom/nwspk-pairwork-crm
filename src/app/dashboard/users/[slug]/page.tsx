import { createClient } from '@/lib/supabase/server'
import { format, isPast } from 'date-fns'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import AddNoteForm from '@/components/dashboard/note-form'
import DeleteNoteButton from '@/components/dashboard/delete-note-button'
import MeetingItem from '@/components/dashboard/meeting-item'
import AddPairworkButton from '@/components/dashboard/add-pairwork-button'

async function getUserProfileBySlug(slug: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return null

  // Get user profile by matching the slug pattern
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
  
  // Find the profile matching the slug
  const profile = profiles?.find(p => {
    const nameSlug = p.full_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    return nameSlug === slug
  })

  if (!profile) return null

  // Get all meetings
  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .or(`organizer_id.eq.${currentUser.id},participant_id.eq.${currentUser.id}`)
    .or(`organizer_id.eq.${profile.id},participant_id.eq.${profile.id}`)
    .order('scheduled_at', { ascending: false })

  // Get notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('contact_id', profile.id)
    .order('created_at', { ascending: false })

  // Process meetings
  const pastMeetings = meetings?.filter(m => isPast(new Date(m.scheduled_at))) || []
  const futureMeetings = meetings?.filter(m => !isPast(new Date(m.scheduled_at))) || []
  const lastSession = pastMeetings[0]
  const nextSession = [...futureMeetings].reverse()[0]

  return {
    profile,
    meetings: meetings || [],
    lastSession,
    nextSession,
    pairworkCount: pastMeetings.length,
    notes: notes || [],
    currentUserId: currentUser.id
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
    const data = await getUserProfileBySlug(params.slug)
  if (!data || !data.profile) return notFound()

  const { 
    profile, 
    meetings,
    lastSession,
    nextSession,
    pairworkCount,
    notes, 
    currentUserId 
  } = data

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between md:space-x-5">
        <div className="flex items-start space-x-5">
          {profile.avatar_url ? (
            <Image
              className="h-16 w-16 rounded-full"
              src={profile.avatar_url}
              alt=""
              width={64}
              height={64}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-medium text-2xl">
                {profile.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
            <div className="mt-1 flex flex-col gap-1">
              <p className="text-sm text-gray-500">
                Total pairwork sessions: <span className="font-medium">{pairworkCount}</span>
              </p>
              {lastSession && (
                <p className="text-sm text-gray-500">
                  Last session: <span className="font-medium">{format(new Date(lastSession.scheduled_at), 'PPP')}</span>
                </p>
              )}
              {nextSession && (
                <p className="text-sm text-gray-500">
                  Next session: <span className="font-medium">{format(new Date(nextSession.scheduled_at), 'PPP')}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
          <AddPairworkButton userId={profile.id} currentUserId={currentUserId} />
          {profile.meeting_link && (
            <a
              href={profile.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Scheduling Link
            </a>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Pairwork Sessions */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium leading-6 text-gray-900">Pairwork Sessions</h2>
          </div>
          <div className="border-t border-gray-200">
            <ul role="list" className="divide-y divide-gray-200">
              {meetings.map((meeting) => (
                <MeetingItem
                  key={meeting.id}
                  meeting={meeting}
                  isOrganizer={meeting.organizer_id === currentUserId}
                />
              ))}
              {meetings.length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
                  No pairwork sessions yet
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium leading-6 text-gray-900">Notes</h2>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-4 sm:px-6">
              <AddNoteForm userId={currentUserId} contactId={profile.id} />
            </div>
            <ul role="list" className="divide-y divide-gray-200">
              {notes.map((note) => (
                <li key={note.id} className="px-4 py-4 sm:px-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.content}</p>
                      {note.image_url && (
                        <div className="mt-2">
                          <Image
                            src={note.image_url}
                            alt="Note attachment"
                            className="rounded-lg max-w-sm object-cover"
                            width={400}
                            height={300}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {format(new Date(note.created_at), 'PPP')}
                      </p>
                    </div>
                    <DeleteNoteButton noteId={note.id} />
                  </div>
                </li>
              ))}
              {notes.length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
                  No notes yet
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = await getUserProfileBySlug(params.slug)
  if (!data || !data.profile) {
    return {
      title: 'User Not Found'
    }
  }

  return {
    title: `${data.profile.full_name} | Pairwork`,
    alternates: {
      canonical: `/dashboard/users/${params.slug}`
    }
  }
} 