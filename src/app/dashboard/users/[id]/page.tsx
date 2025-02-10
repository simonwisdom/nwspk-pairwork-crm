import { createClient } from '@/lib/supabase/server'
import { format, isPast } from 'date-fns'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import AddNoteForm from '@/components/dashboard/note-form'
import DeleteNoteButton from '@/components/dashboard/delete-note-button'
import MeetingItem from '@/components/dashboard/meeting-item'
import AddPairworkButton from '@/components/dashboard/add-pairwork-button'
import type { Metadata } from 'next'

type PageProps = {
  params: Promise<{ id: string }>
}

async function getUserProfile(userId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return null

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) return null

  // Get all meetings for current user and profile
  const { data: userMeetings } = await supabase
    .from('meetings')
    .select('*')
    .or(`organizer_id.eq.${currentUser.id},participant_id.eq.${currentUser.id}`)
    .or(`organizer_id.eq.${userId},participant_id.eq.${userId}`)
    .order('scheduled_at', { ascending: false })

  // Get all meetings for the profile (including with other users)
  const { data: allProfileMeetings } = await supabase
    .from('meetings')
    .select(`
      *,
      organizer:organizer_id(id, full_name, avatar_url),
      participant:participant_id(id, full_name, avatar_url)
    `)
    .or(
      `and(organizer_id.eq.${userId},participant_id.neq.${currentUser.id}),` +
      `and(participant_id.eq.${userId},organizer_id.neq.${currentUser.id})`
    )
    .order('scheduled_at', { ascending: false })

  console.log('All profile meetings:', allProfileMeetings) // Debug log

  // Get notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('contact_id', userId)
    .order('created_at', { ascending: false })

  // Process meetings
  const pastMeetings = userMeetings?.filter(m => isPast(new Date(m.scheduled_at))) || []
  const futureMeetings = userMeetings?.filter(m => !isPast(new Date(m.scheduled_at))) || []
  const lastSession = pastMeetings[0]
  const nextSession = [...futureMeetings].reverse()[0]

  // Process other meetings - simplified logic
  const otherMeetings = allProfileMeetings?.map(meeting => ({
    ...meeting,
    otherPerson: meeting.organizer_id === userId ? meeting.participant : meeting.organizer
  })) || []

  console.log('Processed other meetings:', otherMeetings) // Debug log

  return {
    profile,
    meetings: userMeetings || [],
    otherMeetings,
    lastSession,
    nextSession,
    pairworkCount: pastMeetings.length,
    notes: notes || [],
    currentUserId: currentUser.id
  }
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const data = await getUserProfile(params.id)
  if (!data || !data.profile) return notFound()

  const { 
    profile, 
    meetings,
    otherMeetings,
    lastSession,
    nextSession,
    pairworkCount,
    notes, 
    currentUserId 
  } = data

  const firstName = profile.full_name.split(' ')[0]

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
          <AddPairworkButton userId={params.id} currentUserId={currentUserId} />
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

      <div className="mt-8 flex flex-col lg:flex-row gap-6">
        {/* Pairwork Sessions Column - 1/3 width */}
        <div className="lg:w-1/3 space-y-6">
          {/* Your Pairwork Sessions */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium leading-6 text-gray-900">You + {firstName} Pairwork Sessions</h2>
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

          {/* Other Pairwork Sessions */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium leading-6 text-gray-900">{firstName}&apos;s Cohort Pairwork Sessions</h2>
              <p className="mt-1 text-sm text-gray-500">Sessions with other cohort members</p>
            </div>
            <div className="border-t border-gray-200">
              <ul role="list" className="divide-y divide-gray-200">
                {otherMeetings.map((meeting) => (
                  <li key={meeting.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center space-x-3">
                      {meeting.otherPerson.avatar_url ? (
                        <Image
                          className="h-8 w-8 rounded-full"
                          src={meeting.otherPerson.avatar_url}
                          alt=""
                          width={32}
                          height={32}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#E1F7F7] flex items-center justify-center">
                          <span className="text-[#17BEBB] font-medium text-sm">
                            {meeting.otherPerson.full_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-900">
                          Session with{' '}
                          <span className="font-medium">
                            {meeting.otherPerson.full_name}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {format(new Date(meeting.scheduled_at), 'PPP')}
                          {isPast(new Date(meeting.scheduled_at)) ? ' (Completed)' : ' (Upcoming)'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
                {otherMeetings.length === 0 && (
                  <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
                    No other pairwork sessions yet
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Notes Column - 2/3 width */}
        <div className="lg:w-2/3">
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
    </div>
  )
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const data = await getUserProfile(params.id)
  if (!data || !data.profile) {
    return {
      title: 'User Not Found'
    }
  }

  return {
    title: `${data.profile.full_name} | Pairwork`
  }
} 