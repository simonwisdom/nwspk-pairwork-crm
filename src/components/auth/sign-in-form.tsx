'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'signin' | 'signup'

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        
        if (error) throw error

        if (data.user && data.user.identities?.length === 0) {
          setError('An account with this email already exists.')
          return
        }

        // Automatically sign in after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        router.push('/dashboard')
        router.refresh()
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Auth error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-center space-x-4">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            mode === 'signin'
              ? 'bg-[#17BEBB] text-white'
              : 'text-[#2E282A]/70 hover:text-[#2E282A]'
          }`}
          onClick={() => {
            setMode('signin')
            setError(null)
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            mode === 'signup'
              ? 'bg-[#17BEBB] text-white'
              : 'text-[#2E282A]/70 hover:text-[#2E282A]'
          }`}
          onClick={() => {
            setMode('signup')
            setError(null)
          }}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="fullName" className="sr-only">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required={mode === 'signup'}
                className="appearance-none relative block w-full px-3 py-2 border border-[#2E282A]/20 placeholder-[#2E282A]/50 text-[#2E282A] rounded-md focus:outline-none focus:ring-[#17BEBB] focus:border-[#17BEBB] focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-[#2E282A]/20 placeholder-[#2E282A]/50 text-[#2E282A] rounded-md focus:outline-none focus:ring-[#17BEBB] focus:border-[#17BEBB] focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-[#2E282A]/20 placeholder-[#2E282A]/50 text-[#2E282A] rounded-md focus:outline-none focus:ring-[#17BEBB] focus:border-[#17BEBB] focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#17BEBB] hover:bg-[#17BEBB]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#17BEBB] disabled:opacity-50"
          >
            {loading
              ? mode === 'signin'
                ? 'Signing in...'
                : 'Signing up...'
              : mode === 'signin'
              ? 'Sign in'
              : 'Sign up'}
          </button>
        </div>
      </form>
    </div>
  )
} 