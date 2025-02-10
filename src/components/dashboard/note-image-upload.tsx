'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { ImagePlus, X } from 'lucide-react'

interface NoteImageUploadProps {
  onImageUploaded: (url: string) => void
  existingImageUrl?: string | null
}

export default function NoteImageUpload({ onImageUploaded, existingImageUrl }: NoteImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Reset preview when existingImageUrl changes (including when it's cleared)
  useEffect(() => {
    setPreviewUrl(existingImageUrl ?? null)
  }, [existingImageUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Please upload an image smaller than 5MB')
        return
      }

      setUploading(true)

      // Create a preview URL
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      const supabase = createClient()
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('User not authenticated')

      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('note-images')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(fileName)

      onImageUploaded(publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image. Please try again.')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageUploaded('')
  }

  return (
    <div className="flex items-center">
      <label className={`cursor-pointer rounded p-2 transition-colors ${uploading ? 'opacity-50' : 'hover:text-[#6366F1]'}`}>
        <input
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <ImagePlus className="h-5 w-5" />
      </label>
      {previewUrl && (
        <div className="relative ml-2">
          <Image
            src={previewUrl}
            alt="Note image preview"
            width={24}
            height={24}
            className="rounded object-cover"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
            title="Remove image"
          >
            <X className="h-2 w-2" />
          </button>
        </div>
      )}
    </div>
  )
} 