-- SkillProof schema. Run once in the Supabase SQL editor.
-- There is no auth in this build: a profile id is the capability to read a
-- profile, so row level security stays off and all access goes through server
-- code holding the service role key.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_role text not null,
  weekly_hours integer not null check (weekly_hours between 1 and 60),
  resume_text text not null default '',
  github_username text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists skill_evidence (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  skill text not null,
  claimed boolean not null default false,
  observed boolean not null default false,
  observed_sources jsonb not null default '[]'::jsonb,
  verified_score double precision check (verified_score between 0 and 1),
  proficiency double precision not null default 0 check (proficiency between 0 and 1),
  updated_at timestamptz not null default now(),
  unique (profile_id, skill)
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  skill text not null,
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  score double precision check (score between 0 and 1),
  difficulty_path jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists roadmaps (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  version integer not null,
  status text not null default 'draft' check (status in ('draft', 'approved')),
  created_at timestamptz not null default now(),
  unique (profile_id, version)
);

create table if not exists roadmap_items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps (id) on delete cascade,
  week integer not null check (week >= 1),
  skill text not null,
  title text not null,
  why text not null,
  evidence_summary text not null default '',
  jd_frequency double precision not null default 0,
  est_hours integer not null check (est_hours >= 1),
  resources jsonb not null default '[]'::jsonb,
  proof_project jsonb,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'skipped')),
  user_edited boolean not null default false,
  order_index integer not null default 0
);

create table if not exists score_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  score double precision not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  step text not null,
  detail text not null default '',
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists skill_evidence_profile_idx on skill_evidence (profile_id);
create index if not exists quiz_attempts_profile_idx on quiz_attempts (profile_id);
create index if not exists roadmaps_profile_version_idx on roadmaps (profile_id, version desc);
create index if not exists roadmap_items_roadmap_idx on roadmap_items (roadmap_id, week, order_index);
create index if not exists score_history_profile_idx on score_history (profile_id, created_at);
create index if not exists agent_logs_profile_idx on agent_logs (profile_id, created_at);
