
begin;

create extension if not exists pgcrypto;

drop table if exists public.shadows cascade;
drop table if exists public.hunter_cooldowns cascade;
drop table if exists public.pvp_ratings cascade;
drop table if exists public.guild_settings cascade;
drop table if exists public.cards cascade;
drop table if exists public.hunters cascade;

create table public.hunters (
  user_id text not null,
  guild_id text not null check (guild_id = '1425973312588091394'),
  level integer not null default 1 check (level >= 1),
  exp integer not null default 0 check (exp >= 0),
  rank text not null default 'E-Rank',
  gold integer not null default 150,
  mana integer not null default 100 check (mana >= 0),
  strength integer not null default 5 check (strength >= 0),
  agility integer not null default 5 check (agility >= 0),
  intelligence integer not null default 5 check (intelligence >= 0),
  vitality integer not null default 5 check (vitality >= 0),
  stat_points integer not null default 0 check (stat_points >= 0),
  shadow_slots integer not null default 1 check (shadow_slots >= 0),
  inventory jsonb not null default '[]'::jsonb,
  cooldowns jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, guild_id)
);

create index idx_hunters_guild on public.hunters(guild_id);

create table public.shadows (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  guild_id text not null check (guild_id = '1425973312588091394'),
  name text not null,
  rank text not null,
  rarity text not null,
  rarity_score integer not null default 0,
  base_damage integer not null default 0,
  ability_bonus integer not null default 0,
  level integer not null default 1,
  equipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_shadows_hunters_user_guild
    foreign key (user_id, guild_id)
    references public.hunters(user_id, guild_id)
    on delete cascade
);

create index idx_shadows_user_guild on public.shadows(user_id, guild_id);
create index idx_shadows_equipped on public.shadows(user_id, guild_id, equipped);

create table public.hunter_cooldowns (
  user_id text not null,
  guild_id text not null check (guild_id = '1425973312588091394'),
  cooldown_key text not null,
  available_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, guild_id, cooldown_key),
  constraint fk_cooldowns_hunters_user_guild
    foreign key (user_id, guild_id)
    references public.hunters(user_id, guild_id)
    on delete cascade
);

create table public.pvp_ratings (
  user_id text not null,
  guild_id text not null check (guild_id = '1425973312588091394'),
  points integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, guild_id),
  constraint fk_pvp_hunters_user_guild
    foreign key (user_id, guild_id)
    references public.hunters(user_id, guild_id)
    on delete cascade
);

create table public.guild_settings (
  guild_id text primary key check (guild_id = '1425973312588091394'),
  dungeon_channel_id text,
  dungeon_interval_minutes integer not null default 15 check (dungeon_interval_minutes >= 1),
  dungeon_enabled boolean not null default true,
  last_dungeon_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.cards (
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

create index idx_cards_active_rank on public.cards(active, rank);

alter table public.hunters enable row level security;
alter table public.shadows enable row level security;
alter table public.hunter_cooldowns enable row level security;
alter table public.pvp_ratings enable row level security;
alter table public.guild_settings enable row level security;
alter table public.cards enable row level security;

alter table public.hunters add constraint hunters_inventory_is_array_check check (jsonb_typeof(inventory) = 'array');
alter table public.hunters add constraint hunters_cooldowns_is_object_check check (jsonb_typeof(cooldowns) = 'object');

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_hunters_updated_at
before update on public.hunters
for each row
execute function public.tg_set_updated_at();

create trigger trg_shadows_updated_at
before update on public.shadows
for each row
execute function public.tg_set_updated_at();

create trigger trg_hunter_cooldowns_updated_at
before update on public.hunter_cooldowns
for each row
execute function public.tg_set_updated_at();

create trigger trg_pvp_ratings_updated_at
before update on public.pvp_ratings
for each row
execute function public.tg_set_updated_at();

create trigger trg_guild_settings_updated_at
before update on public.guild_settings
for each row
execute function public.tg_set_updated_at();

create trigger trg_cards_updated_at
before update on public.cards
for each row
execute function public.tg_set_updated_at();

commit;
