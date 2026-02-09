-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Alter existing)
-- Check columns before adding to avoid errors if they don't exist
alter table public.profiles 
  add column if not exists age int,
  add column if not exists bio text,
  add column if not exists images text[] default '{}',
  add column if not exists latitude float,
  add column if not exists longitude float;

-- 2. SWIPES (New table)
create table if not exists public.swipes (
  id uuid default uuid_generate_v4() primary key,
  swiper_id uuid references public.profiles(id) not null,
  swipee_id uuid references public.profiles(id) not null,
  liked boolean not null, -- true = like, false = pass
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(swiper_id, swipee_id)
);

-- RLS for swipes
alter table public.swipes enable row level security;

-- Drop policies if they exist to avoid duplication errors (Postgres doesn't have create policy if not exists)
drop policy if exists "Users can see their own swipes" on swipes;
create policy "Users can see their own swipes"
  on swipes for select
  using ( auth.uid() = swiper_id );

drop policy if exists "Users can insert their own swipes" on swipes;
create policy "Users can insert their own swipes"
  on swipes for insert
  with check ( auth.uid() = swiper_id );

-- 3. HANDLE SWIPE RPC (Integrates with existing CHATS table)
create or replace function handle_swipe(
  p_swiper_id uuid,
  p_swipee_id uuid,
  p_liked boolean
)
returns jsonb as $$
declare
  match_exists boolean;
  new_chat_id uuid;
begin
  -- 1. Insert swipe
  insert into public.swipes (swiper_id, swipee_id, liked)
  values (p_swiper_id, p_swipee_id, p_liked)
  on conflict (swiper_id, swipee_id) do nothing;

  -- 2. If liked, check for match
  if p_liked then
    select exists (
      select 1 from public.swipes s
      where s.swiper_id = p_swipee_id
      and s.swipee_id = p_swiper_id
      and s.liked = true
    ) into match_exists;

    if match_exists then
      -- 3. Create CHAT if mutual like (using existing chats table)
      -- Assuming chats table has 'is_group' column based on schema inspection
      insert into public.chats (is_group)
      values (false)
      returning id into new_chat_id;

      -- 4. Add participants (using existing chat_participants table)
      insert into public.chat_participants (chat_id, user_id)
      values 
        (new_chat_id, p_swiper_id),
        (new_chat_id, p_swipee_id);
      
      return jsonb_build_object('match', true, 'chat_id', new_chat_id);
    end if;
  end if;

  return jsonb_build_object('match', false);
end;
$$ language plpgsql security definer;
