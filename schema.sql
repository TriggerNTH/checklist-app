-- Colle ce SQL dans Supabase > SQL Editor > New query > Run
-- Si tu avais déjà créé la table avant, utilise le bloc "Migration" en bas.

create table checklists (
  id uuid default gen_random_uuid() primary key,
  type text not null default 'checklist',  -- 'checklist' ou 'html'
  title text not null,
  slug text unique not null,
  description text,
  items jsonb not null default '[]',
  html_content text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table checklists enable row level security;

create policy "lecture publique" on checklists
  for select using (true);


-- ============================================================
-- MIGRATION (si la table existe déjà — sinon ignore ce bloc)
-- ============================================================
-- alter table checklists add column if not exists type text not null default 'checklist';
-- alter table checklists add column if not exists html_content text;

