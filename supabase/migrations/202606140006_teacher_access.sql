create table private.teacher_secrets (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  password_hash text not null,
  failed_attempts integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create or replace function public.set_teacher_password(
  target_profile_id uuid,
  plain_password text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(trim(plain_password)) < 8 then
    raise exception 'La clave del profesor debe tener al menos 8 caracteres.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = target_profile_id
      and role in ('teacher', 'admin')
      and active
  ) then
    raise exception 'El perfil indicado no es un profesor activo.';
  end if;

  insert into private.teacher_secrets (
    profile_id,
    password_hash,
    failed_attempts,
    blocked_until
  )
  values (
    target_profile_id,
    extensions.crypt(plain_password, extensions.gen_salt('bf', 11)),
    0,
    null
  )
  on conflict (profile_id) do update set
    password_hash = excluded.password_hash,
    failed_attempts = 0,
    blocked_until = null,
    updated_at = now();
end;
$$;

create or replace function public.establish_teacher_session(
  plain_password text,
  login_auth_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_profile public.profiles%rowtype;
  selected_secret private.teacher_secrets%rowtype;
  session_expires_at timestamptz := now() + interval '8 hours';
begin
  if login_auth_user_id is null or length(trim(plain_password)) < 8 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_credentials');
  end if;

  select p.*
  into selected_profile
  from public.profiles p
  where p.role in ('teacher', 'admin')
    and p.active
  order by p.created_at
  limit 1;

  if selected_profile.id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_credentials');
  end if;

  select *
  into selected_secret
  from private.teacher_secrets
  where profile_id = selected_profile.id;

  if selected_secret.profile_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_credentials');
  end if;

  if selected_secret.blocked_until is not null
    and selected_secret.blocked_until > now() then
    return jsonb_build_object('ok', false, 'reason', 'temporarily_blocked');
  end if;

  if extensions.crypt(plain_password, selected_secret.password_hash)
      <> selected_secret.password_hash then
    update private.teacher_secrets
    set failed_attempts = failed_attempts + 1,
        blocked_until = case
          when failed_attempts + 1 >= 5 then now() + interval '15 minutes'
          else null
        end,
        updated_at = now()
    where profile_id = selected_profile.id;
    return jsonb_build_object('ok', false, 'reason', 'invalid_credentials');
  end if;

  update private.teacher_secrets
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
      'role', selected_profile.role
    )
  );
end;
$$;

revoke all on function public.set_teacher_password(uuid, text)
  from public, anon, authenticated;
revoke all on function public.establish_teacher_session(text, uuid)
  from public, anon, authenticated;
grant execute on function public.set_teacher_password(uuid, text) to service_role;
grant execute on function public.establish_teacher_session(text, uuid) to service_role;
