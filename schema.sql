-- Colle ce SQL dans Supabase > SQL Editor > New query > Run

create table checklists (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  description text,
  items jsonb not null default '[]',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table checklists enable row level security;

create policy "lecture publique" on checklists
  for select using (true);
