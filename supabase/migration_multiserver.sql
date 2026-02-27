alter table public.shadows drop constraint if exists shadows_user_id_fkey;
alter table public.hunter_cooldowns drop constraint if exists hunter_cooldowns_user_id_fkey;
alter table public.pvp_ratings drop constraint if exists pvp_ratings_user_id_fkey;
alter table public.hunters drop constraint if exists hunters_pkey;
alter table public.hunters add column if not exists id uuid default gen_random_uuid();
update public.hunters set id = gen_random_uuid() where id is null;
alter table public.hunters alter column id set not null;
alter table public.hunters add constraint hunters_pkey primary key (id);
create unique index if not exists ux_hunters_user_guild on public.hunters(user_id, guild_id);
alter table public.shadows add column if not exists guild_id text;
update public.shadows s
set guild_id = h.guild_id
from public.hunters h
where s.user_id = h.user_id
  and s.guild_id is null;
alter table public.shadows alter column guild_id set not null;

alter table public.hunter_cooldowns add column if not exists guild_id text;
update public.hunter_cooldowns c
set guild_id = h.guild_id
from public.hunters h
where c.user_id = h.user_id
  and c.guild_id is null;
alter table public.hunter_cooldowns alter column guild_id set not null;

alter table public.pvp_ratings add column if not exists guild_id text;
update public.pvp_ratings p
set guild_id = h.guild_id
from public.hunters h
where p.user_id = h.user_id
  and p.guild_id is null;
delete from public.pvp_ratings where guild_id is null;
alter table public.pvp_ratings alter column guild_id set not null;
alter table public.hunter_cooldowns drop constraint if exists hunter_cooldowns_pkey;
alter table public.hunter_cooldowns add constraint hunter_cooldowns_pkey primary key (user_id, guild_id, cooldown_key);

alter table public.pvp_ratings drop constraint if exists pvp_ratings_pkey;
alter table public.pvp_ratings add constraint pvp_ratings_pkey primary key (user_id, guild_id);
alter table public.shadows drop constraint if exists fk_shadows_hunters_user_guild;
alter table public.shadows
  add constraint fk_shadows_hunters_user_guild
  foreign key (user_id, guild_id)
  references public.hunters(user_id, guild_id)
  on delete cascade;

alter table public.hunter_cooldowns drop constraint if exists fk_cooldowns_hunters_user_guild;
alter table public.hunter_cooldowns
  add constraint fk_cooldowns_hunters_user_guild
  foreign key (user_id, guild_id)
  references public.hunters(user_id, guild_id)
  on delete cascade;

alter table public.pvp_ratings drop constraint if exists fk_pvp_hunters_user_guild;
alter table public.pvp_ratings
  add constraint fk_pvp_hunters_user_guild
  foreign key (user_id, guild_id)
  references public.hunters(user_id, guild_id)
  on delete cascade;
