create or replace function public.set_profile_pin(
  target_profile_id uuid,
  plain_pin text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if plain_pin !~ '^[0-9]{4,8}$' then
    raise exception 'El PIN debe tener entre 4 y 8 cifras.';
  end if;

  insert into private.profile_secrets (profile_id, pin_hash, failed_attempts, blocked_until)
  values (
    target_profile_id,
    extensions.crypt(plain_pin, extensions.gen_salt('bf', 10)),
    0,
    null
  )
  on conflict (profile_id) do update set
    pin_hash = excluded.pin_hash,
    failed_attempts = 0,
    blocked_until = null,
    updated_at = now();
end;
$$;

revoke all on function public.set_profile_pin(uuid, text)
from public, anon, authenticated;
grant execute on function public.set_profile_pin(uuid, text)
to service_role;
