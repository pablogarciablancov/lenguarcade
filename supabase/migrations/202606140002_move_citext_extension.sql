alter extension citext set schema extensions;

create or replace function public.establish_pin_session(
  login_email text,
  plain_pin text,
  login_auth_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_profile public.profiles%rowtype;
  selected_secret private.profile_secrets%rowtype;
  session_expires_at timestamptz := now() + interval '8 hours';
begin
  select *
  into selected_profile
  from public.profiles
  where lower(email::text) = lower(trim(login_email))
    and role = 'student'
    and active
  limit 1;

  if selected_profile.id is null
    or plain_pin !~ '^[0-9]{4,8}$'
    or login_auth_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_credentials');
  end if;

  select *
  into selected_secret
  from private.profile_secrets
  where profile_id = selected_profile.id;

  if selected_secret.blocked_until is not null
    and selected_secret.blocked_until > now() then
    return jsonb_build_object('ok', false, 'reason', 'temporarily_blocked');
  end if;

  if selected_secret.pin_hash is null
    or extensions.crypt(plain_pin, selected_secret.pin_hash) <> selected_secret.pin_hash then
    update private.profile_secrets
    set failed_attempts = failed_attempts + 1,
        blocked_until = case
          when failed_attempts + 1 >= 5 then now() + interval '15 minutes'
          else null
        end,
        updated_at = now()
    where profile_id = selected_profile.id;
    return jsonb_build_object('ok', false, 'reason', 'invalid_credentials');
  end if;

  update private.profile_secrets
  set failed_attempts = 0,
      blocked_until = null,
      updated_at = now()
  where profile_id = selected_profile.id;

  update public.app_sessions
  set revoked_at = now()
  where auth_user_id = login_auth_user_id
    and revoked_at is null;

  insert into public.app_sessions (auth_user_id, profile_id, expires_at)
  values (login_auth_user_id, selected_profile.id, session_expires_at);

  update public.profiles
  set last_login_at = now()
  where id = selected_profile.id;

  return jsonb_build_object(
    'ok', true,
    'expiresAt', session_expires_at,
    'profile', jsonb_build_object(
      'id', selected_profile.id,
      'email', selected_profile.email,
      'firstName', selected_profile.first_name,
      'lastName', selected_profile.last_name,
      'role', selected_profile.role,
      'avatar', selected_profile.avatar
    )
  );
end;
$$;

revoke all on function public.establish_pin_session(text, text, uuid)
from public, anon, authenticated;
grant execute on function public.establish_pin_session(text, text, uuid)
to service_role;
