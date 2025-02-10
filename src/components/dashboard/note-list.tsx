'use client'

import { format } from 'date-fns'
import Image from 'next/image'

interface Note {
  id: string
  content: string
  image_url: string | null
  created_at: string
}

interface NoteListProps {
  notes: Note[]
}

export default function NoteList({ notes }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No notes yet. Add your first note above!
      </div>
    )
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-my-6 divide-y divide-gray-200">
        {notes.map((note) => (
          <div key={note.id} className="py-6">
            <div className="text-sm text-gray-500 mb-2">
              {format(new Date(note.created_at), 'PPP')}
            </div>
            <div className="text-base text-gray-900 whitespace-pre-wrap">
              {note.content}
            </div>
            {note.image_url && (
              <div className="mt-4">
                <Image
                  src={note.image_url}
                  alt="Note image"
                  width={300}
                  height={300}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 