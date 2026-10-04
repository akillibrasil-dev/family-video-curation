create extension if not exists pgcrypto;

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  owner_subject text not null unique,
  display_name text not null default 'Minha família',
  created_at timestamptz not null default now()
);

create table if not exists child_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  avatar text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists child_profiles_family_idx on child_profiles(family_id);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null unique,
  title text not null,
  channel text not null,
  description text not null default '',
  duration_iso text,
  thumbnail_url text,
  embeddable boolean,
  made_for_kids boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profile_videos (
  profile_id uuid not null references child_profiles(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  category text not null default 'Geral',
  tags text[] not null default '{}',
  approved_at timestamptz not null default now(),
  primary key (profile_id, video_id)
);
create index if not exists profile_videos_profile_idx on profile_videos(profile_id, approved_at desc);

create table if not exists content_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references child_profiles(id) on delete cascade,
  query text not null,
  status text not null default 'pending' check (status in ('pending','approved','archived')),
  created_at timestamptz not null default now()
);
create index if not exists content_requests_profile_status_idx on content_requests(profile_id, status, created_at desc);

create table if not exists watch_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references child_profiles(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  watched_at timestamptz not null default now()
);
create index if not exists watch_history_profile_idx on watch_history(profile_id, watched_at desc);
