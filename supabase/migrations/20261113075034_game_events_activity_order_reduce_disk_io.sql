-- El panel docente y las batallas de clase consultan eventos de muchos alumnos
-- ordenados globalmente por (occurred_at, id). Los índices por profile_id
-- no pueden servir ese orden y PostgreSQL hacía una ordenación de filas anchas
-- (incluido details JSONB), creando enormes archivos temporales en disco.
--
-- Este índice permite recorrer el historial en orden sin sort externo.
-- No modifica eventos, XP, progreso ni guardados existentes.
CREATE INDEX IF NOT EXISTS game_events_activity_order_idx
  ON public.game_events (occurred_at ASC, id ASC);

ANALYZE public.game_events;
