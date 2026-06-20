create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists private;
revoke all on schema private from public;

create type public.lengu_role as enum ('student', 'teacher', 'admin');
create type public.sync_status as enum ('pending', 'processing', 'completed', 'failed');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email_domain citext,
  timezone text not null default 'Europe/Madrid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  classroom_user_id text,
  email citext not null,
  first_name text not null default '',
  last_name text not null default '',
  role public.lengu_role not null default 'student',
  avatar jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  source text not null default 'manual',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email),
  unique (organization_id, classroom_user_id)
);

create table private.profile_secrets (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  pin_hash text,
  failed_attempts integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  classroom_course_id text,
  name text not null,
  section text not null default '',
  course_state text not null default 'ACTIVE',
  alternate_link text,
  active boolean not null default true,
  source text not null default 'classroom',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, classroom_course_id)
);

create table public.classroom_teachers (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (classroom_id, profile_id)
);

create table public.classroom_enrollments (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (classroom_id, profile_id)
);

create table public.games (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  category text not null default '',
  status text not null default 'beta',
  sort_order integer not null default 0,
  color text not null default '',
  icon text not null default '',
  url text not null default '',
  banner text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_progress (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  percentage numeric(5,2) not null default 0 check (percentage between 0 and 100),
  accuracy numeric(5,2) not null default 0 check (accuracy between 0 and 100),
  attempts integer not null default 0 check (attempts >= 0),
  successes integer not null default 0 check (successes >= 0),
  errors integer not null default 0 check (errors >= 0),
  streak integer not null default 0 check (streak >= 0),
  sessions integer not null default 0 check (sessions >= 0),
  achievements_count integer not null default 0 check (achievements_count >= 0),
  missions_completed integer not null default 0 check (missions_completed >= 0),
  feathers integer not null default 0 check (feathers >= 0),
  raw_data jsonb not null default '{}'::jsonb,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, game_id)
);

create table public.game_events (
  id uuid primary key default gen_random_uuid(),
  result_id text,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  event_type text not null,
  xp_delta integer not null default 0,
  feathers_delta integer not null default 0,
  accuracy numeric(5,2),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (profile_id, game_id, result_id)
);

create table public.achievement_definitions (
  game_id text not null references public.games(id) on delete cascade,
  id text not null,
  title text not null,
  description text not null default '',
  xp_reward integer not null default 0,
  hidden boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (game_id, id)
);

create table public.player_achievements (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  primary key (profile_id, game_id, achievement_id),
  foreign key (game_id, achievement_id)
    references public.achievement_definitions(game_id, id)
    on delete cascade
);

create table public.game_saves (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  slot text not null default 'main',
  revision bigint not null default 1,
  save_data jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, game_id, slot)
);

create table public.game_errors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  skill text not null default '',
  error_type text not null default '',
  error_count integer not null default 1 check (error_count > 0),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.classroom_grade_mappings (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  game_id text references public.games(id) on delete cascade,
  classroom_course_work_id text not null,
  title text not null,
  max_points numeric(8,2) not null default 10 check (max_points > 0),
  grade_mode text not null default 'draft' check (grade_mode in ('draft', 'assigned')),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (classroom_id, classroom_course_work_id)
);

create table public.grade_sync_queue (
  id uuid primary key default gen_random_uuid(),
  mapping_id uuid not null references public.classroom_grade_mappings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  classroom_submission_id text,
  score numeric(8,2) not null,
  status public.sync_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (mapping_id, profile_id)
);

create table public.classroom_sync_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  sync_type text not null,
  status public.sync_status not null default 'pending',
  courses_seen integer not null default 0,
  students_seen integer not null default 0,
  records_changed integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index profiles_classroom_user_idx on public.profiles(classroom_user_id);
create index profiles_role_active_idx on public.profiles(role, active);
create index app_sessions_auth_active_idx on public.app_sessions(auth_user_id, expires_at)
  where revoked_at is null;
create index enrollments_profile_idx on public.classroom_enrollments(profile_id)
  where active;
create index teachers_profile_idx on public.classroom_teachers(profile_id);
create index progress_game_activity_idx on public.game_progress(game_id, last_activity_at desc);
create index progress_profile_activity_idx on public.game_progress(profile_id, last_activity_at desc);
create index events_profile_time_idx on public.game_events(profile_id, occurred_at desc);
create index events_game_time_idx on public.game_events(game_id, occurred_at desc);
create index achievements_profile_time_idx on public.player_achievements(profile_id, unlocked_at desc);
create index errors_profile_time_idx on public.game_errors(profile_id, occurred_at desc);
create index grade_queue_status_idx on public.grade_sync_queue(status, requested_at);

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.profile_id
  from public.app_sessions s
  join public.profiles p on p.id = s.profile_id
  where s.auth_user_id = auth.uid()
    and s.revoked_at is null
    and s.expires_at > now()
    and p.active
  order by s.created_at desc
  limit 1;
$$;

create or replace function private.is_teacher_for_class(target_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classroom_teachers t
    join public.profiles p on p.id = t.profile_id
    where t.classroom_id = target_classroom_id
      and t.profile_id = private.current_profile_id()
      and p.active
      and p.role in ('teacher', 'admin')
  );
$$;

create or replace function private.can_access_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_profile_id = private.current_profile_id()
    or exists (
      select 1
      from public.classroom_enrollments e
      join public.classroom_teachers t on t.classroom_id = e.classroom_id
      join public.profiles teacher on teacher.id = t.profile_id
      where e.profile_id = target_profile_id
        and e.active
        and t.profile_id = private.current_profile_id()
        and teacher.active
        and teacher.role in ('teacher', 'admin')
    );
$$;

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
    public.crypt(plain_pin, public.gen_salt('bf', 10)),
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
  where email = lower(trim(login_email))::public.citext
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
    or public.crypt(plain_pin, selected_secret.pin_hash) <> selected_secret.pin_hash then
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

revoke all on function private.current_profile_id() from public;
revoke all on function private.is_teacher_for_class(uuid) from public;
revoke all on function private.can_access_profile(uuid) from public;
revoke all on function public.set_profile_pin(uuid, text) from public, anon, authenticated;
revoke all on function public.establish_pin_session(text, text, uuid) from public, anon, authenticated;
grant execute on function private.current_profile_id() to authenticated;
grant execute on function private.is_teacher_for_class(uuid) to authenticated;
grant execute on function private.can_access_profile(uuid) to authenticated;
grant execute on function public.set_profile_pin(uuid, text) to service_role;
grant execute on function public.establish_pin_session(text, text, uuid) to service_role;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at before update on public.organizations
for each row execute function private.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger classrooms_updated_at before update on public.classrooms
for each row execute function private.set_updated_at();
create trigger enrollments_updated_at before update on public.classroom_enrollments
for each row execute function private.set_updated_at();
create trigger games_updated_at before update on public.games
for each row execute function private.set_updated_at();
create trigger progress_updated_at before update on public.game_progress
for each row execute function private.set_updated_at();
create trigger achievement_definitions_updated_at before update on public.achievement_definitions
for each row execute function private.set_updated_at();
create trigger saves_updated_at before update on public.game_saves
for each row execute function private.set_updated_at();
create trigger grade_mappings_updated_at before update on public.classroom_grade_mappings
for each row execute function private.set_updated_at();
create trigger grade_queue_updated_at before update on public.grade_sync_queue
for each row execute function private.set_updated_at();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.app_sessions enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_teachers enable row level security;
alter table public.classroom_enrollments enable row level security;
alter table public.games enable row level security;
alter table public.game_progress enable row level security;
alter table public.game_events enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.player_achievements enable row level security;
alter table public.game_saves enable row level security;
alter table public.game_errors enable row level security;
alter table public.classroom_grade_mappings enable row level security;
alter table public.grade_sync_queue enable row level security;
alter table public.classroom_sync_runs enable row level security;
alter table private.profile_secrets enable row level security;

create policy profiles_select_accessible
on public.profiles for select to authenticated
using (private.can_access_profile(id));

create policy sessions_select_own
on public.app_sessions for select to authenticated
using (auth_user_id = auth.uid());

create policy classrooms_select_member
on public.classrooms for select to authenticated
using (
  private.is_teacher_for_class(id)
  or exists (
    select 1
    from public.classroom_enrollments e
    where e.classroom_id = id
      and e.profile_id = private.current_profile_id()
      and e.active
  )
);

create policy classroom_teachers_select_member
on public.classroom_teachers for select to authenticated
using (
  profile_id = private.current_profile_id()
  or private.is_teacher_for_class(classroom_id)
);

create policy classroom_enrollments_select_member
on public.classroom_enrollments for select to authenticated
using (
  profile_id = private.current_profile_id()
  or private.is_teacher_for_class(classroom_id)
);

create policy games_select_active
on public.games for select to anon, authenticated
using (active);

create policy progress_select_accessible
on public.game_progress for select to authenticated
using (private.can_access_profile(profile_id));

create policy events_select_accessible
on public.game_events for select to authenticated
using (private.can_access_profile(profile_id));

create policy achievement_definitions_select_active_game
on public.achievement_definitions for select to authenticated
using (
  exists (
    select 1 from public.games g
    where g.id = game_id and g.active
  )
);

create policy player_achievements_select_accessible
on public.player_achievements for select to authenticated
using (private.can_access_profile(profile_id));

create policy saves_select_accessible
on public.game_saves for select to authenticated
using (private.can_access_profile(profile_id));

create policy saves_insert_own
on public.game_saves for insert to authenticated
with check (profile_id = private.current_profile_id());

create policy saves_update_own
on public.game_saves for update to authenticated
using (profile_id = private.current_profile_id())
with check (profile_id = private.current_profile_id());

create policy errors_select_accessible
on public.game_errors for select to authenticated
using (private.can_access_profile(profile_id));

create policy grade_mappings_select_teacher
on public.classroom_grade_mappings for select to authenticated
using (private.is_teacher_for_class(classroom_id));

create policy grade_queue_select_teacher
on public.grade_sync_queue for select to authenticated
using (
  exists (
    select 1
    from public.classroom_grade_mappings m
    where m.id = mapping_id
      and private.is_teacher_for_class(m.classroom_id)
  )
);

create policy sync_runs_select_requester
on public.classroom_sync_runs for select to authenticated
using (
  requested_by = private.current_profile_id()
  or exists (
    select 1
    from public.profiles p
    where p.id = private.current_profile_id()
      and p.organization_id = organization_id
      and p.role = 'admin'
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.games to anon, authenticated;
grant select on public.profiles,
  public.app_sessions,
  public.classrooms,
  public.classroom_teachers,
  public.classroom_enrollments,
  public.game_progress,
  public.game_events,
  public.achievement_definitions,
  public.player_achievements,
  public.game_saves,
  public.game_errors,
  public.classroom_grade_mappings,
  public.grade_sync_queue,
  public.classroom_sync_runs
to authenticated;
grant insert, update on public.game_saves to authenticated;

insert into public.games (id, name, subtitle, category, status, sort_order, color, icon)
values
  ('battlegrafia', 'Battlegrafia', 'La aventura de las palabras', 'RPG', 'beta', 1, '#f59e0b', 'dragon'),
  ('maniacgrafia', 'Maniacgrafia', 'Atrapa las palabras', 'Ortografia', 'beta', 2, '#d946ef', 'bolt'),
  ('narratoria', 'Narratoria', 'Escribe. Crea. Cuenta.', 'Escritura', 'beta', 3, '#f59e0b', 'book'),
  ('versopolis', 'Versopolis', 'La ciudad de la poesia', 'Poesia', 'beta', 4, '#8b5cf6', 'pen'),
  ('scrabble', 'Scrabble', 'Palabras en juego', 'Lexico', 'classroom', 5, '#34d399', 'letters'),
  ('conjuga_apuesta', 'Conjuga y Apuesta', 'Verbos 1 contra 1', 'Verbos', 'classroom', 6, '#fb7185', 'dice'),
  ('verb_battle', 'Verb Battle', 'Jeopardy verbal RPG', 'Verbos', 'classroom', 7, '#60a5fa', 'swords')
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  category = excluded.category,
  status = excluded.status,
  sort_order = excluded.sort_order,
  color = excluded.color,
  icon = excluded.icon,
  updated_at = now();

comment on table private.profile_secrets is
  'Server-only PIN hashes. Never expose this table through the Data API.';
comment on table public.game_progress is
  'Authoritative aggregate progress. Write through a trusted backend or Edge Function.';
comment on table public.game_saves is
  'Non-authoritative game checkpoints. Students may update only their own saves.';
comment on table public.grade_sync_queue is
  'Queue consumed by the Classroom bridge. Browser clients cannot insert or update rows.';
