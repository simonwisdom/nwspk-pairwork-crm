import { createClient } from '@/lib/supabase/server'
import { format, isPast } from 'date-fns'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import AddNoteForm from '@/components/dashboard/note-form'
import DeleteNoteButton from '@/components/dashboard/delete-note-button'
import MeetingItem from '@/components/dashboard/meeting-item'
import AddPairworkButton from '@/components/dashboard/add-pairwork-button'
import EditNoteButton from '@/components/dashboard/edit-note-button'

// Helper function to convert name to slug
function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

async function getUserProfile(slug: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return null

  // Get all user profiles to find the one matching the slug
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')

  // Find the profile matching the slug
  const profile = profiles?.find(p => nameToSlug(p.full_name) === slug)
  if (!profile) return null

  // Get all meetings where either user is involved
  const { data: allMeetings } = await supabase
    .from('meetings')
    .select('*, organizer:organizer_id(full_name), participant:participant_id(full_name)')
    .or(`organizer_id.eq.${currentUser.id},participant_id.eq.${currentUser.id},organizer_id.eq.${profile.id},participant_id.eq.${profile.id}`)
    .order('scheduled_at', { ascending: false })

  // Split meetings into shared and other sessions
  const meetings = allMeetings || []
  const sharedMeetings = meetings.filter(m => 
    (m.organizer_id === currentUser.id && m.participant_id === profile.id) ||
    (m.organizer_id === profile.id && m.participant_id === currentUser.id)
  )
  const otherMeetings = meetings.filter(m =>
    (m.organizer_id === profile.id || m.participant_id === profile.id) &&
    m.organizer_id !== currentUser.id &&
    m.participant_id !== currentUser.id
  )

  // Get notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('contact_id', profile.id)
    .order('created_at', { ascending: false })

  // Process shared meetings
  const pastMeetings = sharedMeetings.filter(m => isPast(new Date(m.scheduled_at)))
  const futureMeetings = sharedMeetings.filter(m => !isPast(new Date(m.scheduled_at)))
  const lastSession = pastMeetings[0]
  const nextSession = [...futureMeetings].reverse()[0]

  return {
    profile,
    sharedMeetings,
    otherMeetings,
    lastSession,
    nextSession,
    pairworkCount: pastMeetings.length,
    notes: notes || [],
    currentUserId: currentUser.id
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: { slug: string }
}) {
  const data = await getUserProfile(params.slug)
  if (!data || !data.profile) return notFound()

  const { 
    profile, 
    sharedMeetings, 
    otherMeetings,
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
            <img className="h-16 w-16 rounded-full" src={profile.avatar_url} alt="" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[#E1F7F7] flex items-center justify-center">
              <span className="text-[#17BEBB] font-medium text-2xl">
                {profile.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#2E282A]">{profile.full_name}</h1>
            <div className="mt-1 flex flex-col gap-1">
              <p className="text-sm text-[#2E282A]/60">
                Total pairwork sessions: <span className="font-medium text-[#2E282A]">{pairworkCount}</span>
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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-flow-col lg:grid-cols-3">
        {/* Pairwork Sessions Container */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Your Shared Sessions */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium leading-6 text-gray-900">Your Pairwork Sessions</h2>
            </div>
            <div className="border-t border-gray-200">
              <ul role="list" className="divide-y divide-gray-200">
                {sharedMeetings.map((meeting) => (
                  <MeetingItem
                    key={meeting.id}
                    meeting={meeting}
                    isOrganizer={meeting.organizer_id === currentUserId}
                  />
                ))}
                {sharedMeetings.length === 0 && (
                  <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
                    No shared pairwork sessions yet
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Their Other Sessions */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium leading-6 text-gray-900">
                {profile.full_name.split(' ')[0]}'s Other Sessions
              </h2>
            </div>
            <div className="border-t border-gray-200">
              <ul role="list" className="divide-y divide-gray-200">
                {otherMeetings.map((meeting) => (
                  <li key={meeting.id} className="px-4 py-4 sm:px-6">
                    <p className="text-sm text-gray-900">
                      With {meeting.organizer_id === profile.id 
                        ? meeting.participant.full_name
                        : meeting.organizer.full_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {format(new Date(meeting.scheduled_at), 'PPP')}
                    </p>
                  </li>
                ))}
                {otherMeetings.length === 0 && (
                  <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
                    No other pairwork sessions
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="lg:col-span-2 bg-white shadow sm:rounded-lg">
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
                            width={400}
                            height={300}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {format(new Date(note.created_at), 'PPP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <EditNoteButton note={note} />
                      <DeleteNoteButton noteId={note.id} />
                    </div>
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