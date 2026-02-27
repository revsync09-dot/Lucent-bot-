create extension if not exists pgcrypto;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  rank text not null,
  role text not null default 'Hunter',
  atk integer not null default 10,
  hp integer not null default 10,
  def integer not null default 10,
  skill text not null default 'Unknown',
  asset text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cards_active_rank on public.cards(active, rank);
alter table public.cards enable row level security;
