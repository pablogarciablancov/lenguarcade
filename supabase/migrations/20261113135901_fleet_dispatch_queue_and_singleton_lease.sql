-- Applied to production Supabase as migration 20261113135901.

-- Las recompensas se registran al guardar, sin bloquear guardados por Google Apps Script.
-- Los talleres +5 usan la misma cola secuencial que los premios semanales +1.
create table if not exists public.fleet_workshop_awards (
  award_id text primary key,
  profile_id uuid not null references public.profiles(id),
  points smallint not null default 5 check (points = 5),
  title text not null check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);
alter table public.fleet_workshop_awards enable row level security;
revoke all on public.fleet_workshop_awards from public, anon, authenticated;
grant select, insert, update on public.fleet_workshop_awards to service_role;
create index if not exists fleet_workshop_pending_idx
  on public.fleet_workshop_awards (created_at, award_id) where delivered_at is null;

-- Solo un trabajador puede contactar Google Apps Script en cada momento.
create table if not exists private.fleet_dispatch_control (
  id integer primary key check (id = 1),
  token_digest text not null,
  lease_owner uuid,
  lease_expires_at timestamptz,
  last_started_at timestamptz,
  last_completed_at timestamptz
);
revoke all on private.fleet_dispatch_control from public, anon, authenticated;

-- El token se genera en PostgreSQL y se guarda exclusivamente cifrado en Vault.
-- No se registra en migraciones, comentarios, logs ni código.
do $fleet_secret$
declare
  worker_token text;
begin
  select decrypted_secret into worker_token
  from vault.decrypted_secrets where name = 'lenguarcade_fleet_dispatch_token'
  limit 1;
  if worker_token is null then
    worker_token := encode(extensions.gen_random_bytes(32), 'hex');
    perform vault.create_secret(worker_token, 'lenguarcade_fleet_dispatch_token',
      'Token privado del programador de premios de Flota LenguArcade');
  end if;
  insert into private.fleet_dispatch_control(id, token_digest)
  values(1, encode(extensions.digest(worker_token, 'sha256'), 'hex'))
  on conflict (id) do update set token_digest=excluded.token_digest;
end
$fleet_secret$;

create or replace function public.fleet_begin_dispatch(p_token text)
returns uuid
language plpgsql security definer volatile set search_path = ''
as $function$
declare
  assigned_owner uuid := pg_catalog.gen_random_uuid();
begin
  if length(coalesce(p_token, '')) <> 64 then return null; end if;
  update private.fleet_dispatch_control
    set lease_owner = assigned_owner,
        lease_expires_at = now() + interval '85 seconds',
        last_started_at = now()
  where id = 1
    and token_digest = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and (lease_expires_at is null or lease_expires_at < now());
  if not found then return null; end if;
  return assigned_owner;
end
$function$;

create or replace function public.fleet_end_dispatch(p_token text, p_owner uuid)
returns boolean
language plpgsql security definer volatile set search_path = ''
as $function$
begin
  if length(coalesce(p_token, '')) <> 64 or p_owner is null then return false; end if;
  update private.fleet_dispatch_control
    set lease_owner = null,
        lease_expires_at = null,
        last_completed_at = now()
  where id = 1 and lease_owner = p_owner
    and token_digest = encode(extensions.digest(p_token, 'sha256'), 'hex');
  return found;
end
$function$;

revoke all on function public.fleet_begin_dispatch(text) from public, anon, authenticated;
revoke all on function public.fleet_end_dispatch(text,uuid) from public, anon, authenticated;
grant execute on function public.fleet_begin_dispatch(text) to service_role;
grant execute on function public.fleet_end_dispatch(text,uuid) to service_role;

