'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const isUserProfile = pathname.startsWith('/dashboard/users/')

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-[#2E282A] shadow">
      <div className="mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Image
              src="/images/book_logo_small.png"
              alt="Book Logo"
              width={40}
              height={40}
              className="invert"
              priority
            />
          </div>
          <h1 className="text-xl font-semibold text-white">
            {isUserProfile ? (
              <Link href="/dashboard" className="text-[#17BEBB] hover:text-[#15aaa7]">
                ← Back to Dashboard
              </Link>
            ) : (
              'Newspeak House Pairwork Dashboard'
            )}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 text-[#FAD8D6] hover:text-white"
          >
            <User className="h-5 w-5" />
            <span>Your Profile</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="btn-secondary"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
} 