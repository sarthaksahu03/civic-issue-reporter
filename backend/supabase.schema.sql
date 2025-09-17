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
  created_at timestamp with time zone default timezone('utc', now())
);

-- Enable uuid_generate_v4 if not already enabled
create extension if not exists "uuid-ossp";
