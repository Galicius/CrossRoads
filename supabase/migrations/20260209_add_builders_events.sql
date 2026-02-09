-- Migration to add Builders and Events

-- Create Builders Table
CREATE TABLE IF NOT EXISTS builders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    location TEXT, -- Simple text location for now
    owner_id UUID REFERENCES auth.users(id), -- Optional: Link to a user account
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    location TEXT,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    activity_type TEXT, -- e.g. 'Yoga', 'Hike', 'Workshop'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Event Participants Table (Join Table)
CREATE TABLE IF NOT EXISTS event_participants (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Assuming 'users' means auth.users or profiles. Usually foreign key to auth.users is best.
    status TEXT DEFAULT 'going', -- 'going', 'maybe', 'invited'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- Seed Data (Builders)
INSERT INTO builders (name, description, logo_url, website, location)
VALUES 
('VanLife Customs', 'Premier custom van builder in Colorado.', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80', 'https://vanlifecustoms.com', 'Denver, CO'),
('Nomad Vanz', 'High-end adventure vehicle conversions.', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80', 'https://nomadvanz.com', 'Vancouver, BC'),
('Tiny Home Builders', 'We build tiny homes on wheels.', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80', 'https://tinyhome.com', 'Portland, OR');

-- Seed Data (Events)
INSERT INTO events (title, description, start_time, location, image_url, activity_type)
VALUES
('Sunrise Yoga', 'Relax with me at sunrise yoga this Saturday! We''ll have a great time.', NOW() + INTERVAL '2 days', 'Jeruzalem, Slovenia', 'https://images.unsplash.com/photo-1544367563-121910aa662f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80', 'Yoga'),
('Mountain Hike', 'Group hike up Mount Tamalpais. Bring water!', NOW() + INTERVAL '5 days', 'Mill Valley, CA', 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80', 'Hiking'),
('Van Electrical Workshop', 'Learn how to wire your van safely.', NOW() + INTERVAL '10 days', 'San Diego, CA', 'https://images.unsplash.com/photo-1581092921461-eab62e97a783?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80', 'Workshop');

-- Seed Participants (We need a valid user ID to insert into event_participants, so we skip this in seed unless we know a user ID. 
-- Instead, the user can join an event in the app to populate this.)
