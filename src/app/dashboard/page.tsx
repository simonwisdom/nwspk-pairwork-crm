import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isPast, format } from 'date-fns'
import ScheduleMeetingButton from '@/components/dashboard/schedule-meeting-button'
import Image from 'next/image'

function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

async function getUsers() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { users: [], currentUser: null }

  // Get current user's profile
  const { data: currentUserProfile } = await supabase
    .from('user_profiles')
    .select('meeting_link')
    .eq('id', user.id)
    .single()

  // Get all users except current user
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url, meeting_link')

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return { users: [], currentUser: null }
  }

  // Filter out current user from the results
  const otherUsers = users?.filter(profile => profile.id !== user.id) || []

  // Get all meetings for each user
  const { data: allMeetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .or(`organizer_id.eq.${user.id},participant_id.eq.${user.id}`)
    .order('scheduled_at', { ascending: false })

  if (meetingsError) {
    console.error('Error fetching meetings:', meetingsError)
  }

  // Define a Meeting type for better type safety
  type Meeting = {
    scheduled_at: string;
    organizer_id: string;
    participant_id: string;
  }

  // Process meetings for each user
  const userStats = otherUsers.reduce((acc, otherUser) => {
    const userMeetings = allMeetings?.filter(m => 
      (m.organizer_id === user.id && m.participant_id === otherUser.id) ||
      (m.organizer_id === otherUser.id && m.participant_id === user.id)
    ) || []

    const pastMeetings = userMeetings.filter(m => isPast(new Date(m.scheduled_at)))
    const futureMeetings = userMeetings.filter(m => !isPast(new Date(m.scheduled_at)))
    const lastSession = pastMeetings[0]
    const nextSession = [...futureMeetings].reverse()[0]

    acc[otherUser.id] = {
      pairworkCount: pastMeetings.length,
      lastSession,
      nextSession
    }
    return acc
  }, {} as Record<string, { pairworkCount: number, lastSession?: Meeting, nextSession?: Meeting }>)

  return {
    users: otherUsers,
    userStats,
    currentUserId: user.id,
    currentUser: currentUserProfile
  }
}

export default async function DashboardPage() {
  const { users, userStats, currentUserId, currentUser } = await getUsers()

  return (
    <div className="max-w-7xl mx-auto">
      {!currentUser?.meeting_link && (
        <div className="mb-8 rounded-md bg-[#E1F7F7] p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-[#EF3E36]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-[#2E282A]">
                Meeting Link Required
              </h3>
              <div className="mt-2 text-sm text-[#2E282A]">
                <p>
                  Please <Link href="/dashboard/profile" className="font-medium underline hover:text-[#17BEBB]">update your profile</Link> to add your meeting link. This will allow other team members to schedule pairwork sessions with you.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <p className="mt-2 text-sm text-[#2E282A]">
            Schedule some pairwork with the cohort!
          </p>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-[#2E282A] ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-[#2E282A]/10">
                <thead className="bg-[#E1F7F7]">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#2E282A] sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#2E282A]">
                      Pairwork Stats
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E282A]/10 bg-white">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-sm text-[#2E282A] text-center">
                        No other users found. This could mean:
                        <ul className="list-disc list-inside mt-2">
                          <li>You&apos;re the only user in the system</li>
                          <li>Other users haven&apos;t completed their profile setup</li>
                        </ul>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const stats = userStats?.[user.id]
                      return (
                        <tr key={user.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <Link 
                              href={`/dashboard/users/${nameToSlug(user.full_name)}`} 
                              className="flex items-center hover:opacity-75"
                            >
                              <div className="h-10 w-10 flex-shrink-0">
                                {user.avatar_url ? (
                                  <Image 
                                    className="h-10 w-10 rounded-full"
                                    src={user.avatar_url}
                                    alt=""
                                    width={40}
                                    height={40}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-[#E1F7F7] flex items-center justify-center">
                                    <span className="text-[#17BEBB] font-medium text-lg">
                                      {user.full_name?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-[#2E282A]">{user.full_name}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-[#2E282A]">
                            <div className="flex flex-col gap-1">
                              <p>
                                Total sessions: <span className="font-medium">{stats?.pairworkCount || 0}</span>
                              </p>
                              {stats?.lastSession && (
                                <p>
                                  Last session: <span className="font-medium">{format(new Date(stats.lastSession.scheduled_at), 'PPP')}</span>
                                </p>
                              )}
                              {stats?.nextSession && (
                                <p>
                                  Next session: <span className="font-medium">{format(new Date(stats.nextSession.scheduled_at), 'PPP')}</span>
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end gap-4">
                              <ScheduleMeetingButton 
                                userId={user.id}
                                currentUserId={currentUserId ?? ''}
                                meetingLink={user.meeting_link ?? ''}
                              />
                              <Link
                                href={`/dashboard/users/${nameToSlug(user.full_name)}`}
                                className="link-primary"
                              >
                                View Pairwork Notes
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 