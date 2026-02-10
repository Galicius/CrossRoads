-- Update existing events to match new categories
UPDATE events SET activity_type = 'Sports' WHERE activity_type IN ('Yoga', 'Hiking', 'Climbing', 'Skiing');
UPDATE events SET activity_type = 'Tech' WHERE activity_type IN ('Workshop', 'Coding');
UPDATE events SET activity_type = 'Arts' WHERE activity_type IN ('Painting', 'Drawing');

-- Insert some seed data for Music and Arts if they don't exist
INSERT INTO events (title, description, time_text, location, image_url, activity_type)
SELECT 'Jazz Night', 'Smooth jazz evening in the park.', '7 PM - 10 PM', 'Central Park', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', 'Music'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE activity_type = 'Music');

INSERT INTO events (title, description, time_text, location, image_url, activity_type)
SELECT 'Pottery Class', 'Learn to make your own mugs.', '2 PM - 4 PM', 'Art Studio', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', 'Arts'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE activity_type = 'Arts');
