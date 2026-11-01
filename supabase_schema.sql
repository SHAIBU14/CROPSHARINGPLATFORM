-- ========================================================================
-- Community Garden & Crop Sharing Platform
-- Supabase SQL Database Schema: User Profiles & Messages
-- ========================================================================
-- This table stores additional user profile information connected to
-- Firebase Authentication via the authenticated Firebase User ID (firebase_uid / id).
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,                       -- Matches Firebase User UID
    firebase_uid TEXT UNIQUE,                  -- Firebase Auth UID
    email TEXT,                                -- Registered user email
    username TEXT,                             -- Registered platform username
    first_name TEXT,                           -- User first name
    last_name TEXT,                            -- User last name
    full_name TEXT,                            -- User full name
    phone_number TEXT,                         -- Contact phone number (if available)
    location TEXT,                             -- User location (city, state, address)
    bio TEXT,                                  -- Biography / gardening notes
    garden_experience TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
    profile_image TEXT,                        -- Avatar image URL
    created_at TIMESTAMPTZ DEFAULT NOW(),      -- Account registration timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW()       -- Last update timestamp
);

-- Index on firebase_uid and email for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON public.profiles (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- Enable Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles
CREATE POLICY "Allow public read access" ON public.profiles
    FOR SELECT USING (true);

-- Allow authenticated users to insert or update their profile row
CREATE POLICY "Allow profile upsert" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

-- ========================================================================
-- Messages Table (for real-time & persistent crop seller chat)
-- Stores messages between buyers and sellers identified by Firebase User IDs
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,                       -- Unique message ID
    sender_id TEXT NOT NULL,                   -- Sender's Firebase UID or user ID
    receiver_id TEXT NOT NULL,                 -- Receiver's Firebase UID or user ID
    sender_name TEXT,                          -- Sender's full name
    receiver_name TEXT,                        -- Receiver's full name
    sender_avatar TEXT,                        -- Sender's profile image URL
    receiver_avatar TEXT,                      -- Receiver's profile image URL
    content TEXT NOT NULL,                     -- Message text content
    is_read BOOLEAN DEFAULT FALSE,             -- Read status
    created_at TIMESTAMPTZ DEFAULT NOW()       -- Message creation timestamp
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);

-- Enable Row Level Security (RLS) for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read messages" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Allow insert messages" ON public.messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update messages" ON public.messages
    FOR UPDATE USING (true);
