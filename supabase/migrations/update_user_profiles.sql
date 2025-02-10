-- Add meeting_link column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN meeting_link TEXT;

-- Update RLS policies to allow users to update their own meeting link
CREATE POLICY "Users can update their own meeting link"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id); 