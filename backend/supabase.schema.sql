-- Users table (Supabase Auth manages core fields, but you can extend with profile fields)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text default 'citizen',
  created_at timestamp with time zone default timezone('utc', now())
);

-- Grievances table
create table if not exists grievances (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null,
  location text,
  user_id uuid references users(id) on delete set null,
  status text default 'pending',
  priority text default 'medium',
  estimated_resolution_days integer,
  image_urls text[] default '{}',
  audio_url text,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Notifications table (for sending updates to users on admin actions)
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info', -- info | success | warning | error
  read boolean default false,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Feedback table (citizen satisfaction after resolution)
create table if not exists feedbacks (
  id uuid primary key default uuid_generate_v4(),
  grievance_id uuid references grievances(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  rating integer check (rating between 1 and 5),
  comments text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Enable uuid_generate_v4 if not already enabled
create extension if not exists "uuid-ossp";
