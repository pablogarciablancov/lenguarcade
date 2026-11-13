-- Already applied to production; stores no credentials.

-- Este trabajo solo llama al backend si existen premios pendientes.
-- La clave privada se lee de Vault exclusivamente en el servidor;
-- nunca se copia a este fichero ni a los logs.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

select cron.schedule(
  'lenguarcade-fleet-dispatch-every-minute',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://spqcztbuwcbmsengeluz.supabase.co/functions/v1/fleet-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-fleet-worker-token',
        (select decrypted_secret from vault.decrypted_secrets
          where name = 'lenguarcade_fleet_dispatch_token' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  )
  where exists(select 1 from public.fleet_weekly_awards where delivered_at is null)
     or exists(select 1 from public.fleet_workshop_awards where delivered_at is null);
  $job$
);

