import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const SUPABASE_URL = 'https://coomqgvkdkbpttcotpki.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvb21xZ3ZrZGticHR0Y290cGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzQwODcsImV4cCI6MjA4NjE1MDA4N30.3SD6OrarY4iN5AysVH9x0FejfxTRFzEqDtXOjSPXlHE';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
