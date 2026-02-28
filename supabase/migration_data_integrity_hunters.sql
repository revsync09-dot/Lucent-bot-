begin;

update public.hunters
set inventory = '[]'::jsonb
where inventory is null or jsonb_typeof(inventory) <> 'array';

update public.hunters
set cooldowns = '{}'::jsonb
where cooldowns is null or jsonb_typeof(cooldowns) <> 'object';

alter table public.hunters alter column inventory set default '[]'::jsonb;
alter table public.hunters alter column inventory set not null;
alter table public.hunters alter column cooldowns set default '{}'::jsonb;
alter table public.hunters alter column cooldowns set not null;

alter table public.hunters drop constraint if exists hunters_inventory_is_array_check;
alter table public.hunters
  add constraint hunters_inventory_is_array_check check (jsonb_typeof(inventory) = 'array');

alter table public.hunters drop constraint if exists hunters_cooldowns_is_object_check;
alter table public.hunters
  add constraint hunters_cooldowns_is_object_check check (jsonb_typeof(cooldowns) = 'object');

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hunters_updated_at on public.hunters;
create trigger trg_hunters_updated_at
before update on public.hunters
for each row
execute function public.tg_set_updated_at();

drop trigger if exists trg_shadows_updated_at on public.shadows;
create trigger trg_shadows_updated_at
before update on public.shadows
for each row
execute function public.tg_set_updated_at();

drop trigger if exists trg_hunter_cooldowns_updated_at on public.hunter_cooldowns;
create trigger trg_hunter_cooldowns_updated_at
before update on public.hunter_cooldowns
for each row
execute function public.tg_set_updated_at();

drop trigger if exists trg_pvp_ratings_updated_at on public.pvp_ratings;
create trigger trg_pvp_ratings_updated_at
before update on public.pvp_ratings
for each row
execute function public.tg_set_updated_at();

drop trigger if exists trg_guild_settings_updated_at on public.guild_settings;
create trigger trg_guild_settings_updated_at
before update on public.guild_settings
for each row
execute function public.tg_set_updated_at();

drop trigger if exists trg_cards_updated_at on public.cards;
create trigger trg_cards_updated_at
before update on public.cards
for each row
execute function public.tg_set_updated_at();

commit;
