import Link from 'next/link'
import Image from 'next/image'

// Add this interface above the component
interface User {
  id: string
  full_name: string
  email: string
  avatar_url?: string
}

function generateNameSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function UserList({ users }: { users: User[] }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {users.map((user) => {
        const nameSlug = generateNameSlug(user.full_name)
        return (
          <li key={user.id} className="flex justify-between gap-x-6 py-5">
            <Link 
              href={`/dashboard/users/${nameSlug}`}
              className="flex min-w-0 gap-x-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              {user.avatar_url ? (
                <Image
                  className="h-12 w-12 flex-none rounded-full bg-gray-50"
                  src={user.avatar_url}
                  alt=""
                  width={48}
                  height={48}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-medium text-xl">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">{user.full_name}</p>
                <p className="mt-1 truncate text-xs leading-5 text-gray-500">{user.email}</p>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
} 