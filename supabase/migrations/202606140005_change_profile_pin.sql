create or replace function public.change_profile_pin(
  target_profile_id uuid,
  old_pin text,
  new_pin text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_hash text;
begin
  if new_pin !~ '^[0-9]{4,8}$' then
    raise exception 'El nuevo PIN debe tener entre 4 y 8 cifras.';
  end if;

  select pin_hash
  into current_hash
  from private.profile_secrets
  where profile_id = target_profile_id;

  if current_hash is null
    or extensions.crypt(old_pin, current_hash) <> current_hash then
    return false;
  end if;

  update private.profile_secrets
  set pin_hash = extensions.crypt(new_pin, extensions.gen_salt('bf', 10)),
      failed_attempts = 0,
      blocked_until = null,
      updated_at = now()
  where profile_id = target_profile_id;
  return true;
end;
$$;

revoke all on function public.change_profile_pin(uuid, text, text)
from public, anon, authenticated;
grant execute on function public.change_profile_pin(uuid, text, text)
to service_role;
