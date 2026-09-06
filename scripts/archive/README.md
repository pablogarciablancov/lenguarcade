# Scripts archivados

Esta carpeta contiene herramientas de migración o limpieza que ya cumplieron su
función y **no forman parte del flujo operativo de LenguArcade**.

Se conservan únicamente como historial técnico y para poder consultar cómo se
realizaron migraciones anteriores.

No ejecutar estos scripts contra producción sin revisar primero su código y el
estado actual de Supabase/Sheets.

## Contenido

- `cleanup_demo_data.py`: limpieza puntual de datos de demostración.
- `migrate_maniac_name_progress.py`: migración histórica de progreso de Maniacgrafía.
- `migrate_narratoria_sheets.py`: migración histórica de Narratoria desde Sheets.
- `migrate_sheets_to_supabase.py`: migración inicial del backend legacy a Supabase.

Las comprobaciones activas permanecen directamente en `scripts/`.
