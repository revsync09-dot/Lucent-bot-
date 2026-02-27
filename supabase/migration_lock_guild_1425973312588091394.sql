begin;

delete from public.shadows where guild_id <> '1425973312588091394';
delete from public.hunter_cooldowns where guild_id <> '1425973312588091394';
delete from public.pvp_ratings where guild_id <> '1425973312588091394';
delete from public.guild_settings where guild_id <> '1425973312588091394';
delete from public.hunters where guild_id <> '1425973312588091394';

alter table public.hunters drop constraint if exists hunters_guild_id_check;
alter table public.hunters
  add constraint hunters_guild_id_check check (guild_id = '1425973312588091394');

alter table public.shadows drop constraint if exists shadows_guild_id_check;
alter table public.shadows
  add constraint shadows_guild_id_check check (guild_id = '1425973312588091394');

alter table public.hunter_cooldowns drop constraint if exists hunter_cooldowns_guild_id_check;
alter table public.hunter_cooldowns
  add constraint hunter_cooldowns_guild_id_check check (guild_id = '1425973312588091394');

alter table public.pvp_ratings drop constraint if exists pvp_ratings_guild_id_check;
alter table public.pvp_ratings
  add constraint pvp_ratings_guild_id_check check (guild_id = '1425973312588091394');

alter table public.guild_settings drop constraint if exists guild_settings_guild_id_check;
alter table public.guild_settings
  add constraint guild_settings_guild_id_check check (guild_id = '1425973312588091394');

commit;
