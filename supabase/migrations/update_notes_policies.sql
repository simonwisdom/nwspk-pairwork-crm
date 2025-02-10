-- Drop existing notes table and recreate it
DROP TABLE IF EXISTS notes CASCADE;

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can see their notes" ON notes;
DROP POLICY IF EXISTS "Users can read their own notes" ON notes;
DROP POLICY IF EXISTS "Users can create notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Create new policies for notes
-- Allow users to read notes where they are either the creator or the contact
CREATE POLICY "Users can read notes they're involved with"
    ON notes FOR SELECT
    USING (
        auth.uid() = user_id OR 
        auth.uid() = contact_id
    );

-- Allow users to create notes (they must be the user_id)
CREATE POLICY "Users can create notes"
    ON notes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
    );

-- Allow users to update their own notes
CREATE POLICY "Users can update their own notes"
    ON notes FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own notes
CREATE POLICY "Users can delete their own notes"
    ON notes FOR DELETE
    USING (auth.uid() = user_id);

-- Recreate indexes for notes
DROP INDEX IF EXISTS notes_user_id_idx;
DROP INDEX IF EXISTS notes_contact_id_idx;
DROP INDEX IF EXISTS notes_meeting_id_idx;

CREATE INDEX notes_user_id_idx ON notes(user_id);
CREATE INDEX notes_contact_id_idx ON notes(contact_id);
CREATE INDEX notes_meeting_id_idx ON notes(meeting_id); 