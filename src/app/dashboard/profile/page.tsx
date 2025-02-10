'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Image as ImageIcon, Upload, RefreshCw } from 'lucide-react'
import Image from 'next/image'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DICEBEAR_API = 'https://api.dicebear.com/7.x/avataaars/svg'

export default function ProfilePage() {
  const [meetingLink, setMeetingLink] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('meeting_link, full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        setMeetingLink(profile.meeting_link || '')
        const [first = '', last = ''] = (profile.full_name || '').split(' ')
        setFirstName(first)
        setLastName(last)
        setAvatarUrl(profile.avatar_url)
      }
    }

    loadProfile()
  }, [router])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' })
      return
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'File must be JPEG, PNG, or WebP' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload file to Supabase Storage in user's folder
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Delete old avatar if it exists and is not a DiceBear URL
      if (avatarUrl && !avatarUrl.includes('dicebear.com')) {
        const oldFileName = avatarUrl.split('/').pop()
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldFileName}`])
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: 'Failed to upload profile picture. Please try again.' })
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const generateRandomAvatar = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate random seed
      const seed = Math.random().toString(36).substring(7)
      const avatarUrl = `${DICEBEAR_API}?seed=${seed}`

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(avatarUrl)
      setMessage({ type: 'success', text: 'Profile picture generated successfully!' })
    } catch (error) {
      console.error('Error generating avatar:', error)
      setMessage({ type: 'error', text: 'Failed to generate profile picture. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          meeting_link: meetingLink,
          full_name: `${firstName} ${lastName}`.trim()
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="link-primary flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-[#2E282A]">Your Profile</h3>

          {/* Avatar Section */}
          <div className="mt-6 flex items-center gap-6">
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <div className="relative h-24 w-24 rounded-full overflow-hidden">
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full bg-[#E1F7F7] flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-[#17BEBB]" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="btn-secondary"
              >
                <Upload className="h-4 w-4" />
                Upload Picture
              </button>
              <button
                type="button"
                onClick={generateRandomAvatar}
                disabled={loading}
                className="btn-secondary"
              >
                <RefreshCw className="h-4 w-4" />
                Generate Random Avatar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-[#2E282A]/60">
                JPEG, PNG, or WebP. Max 5MB.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[#2E282A]">
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    className="input-primary"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[#2E282A]">
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    className="input-primary"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="meetingLink" className="block text-sm font-medium text-[#2E282A]">
                Meeting Link
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  name="meetingLink"
                  id="meetingLink"
                  className="input-primary"
                  placeholder="https://calendly.com/your-link"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  required
                />
              </div>
              <p className="mt-2 text-sm text-[#2E282A]/60">
                Add your scheduling link (e.g., Calendly) where other team members can book pairwork sessions with you.
              </p>
            </div>

            {message && (
              <div className={`rounded-md p-4 ${
                message.type === 'success' ? 'bg-[#17BEBB]/10' : 'bg-[#EF3E36]/10'
              }`}>
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-[#17BEBB]' : 'text-[#EF3E36]'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 