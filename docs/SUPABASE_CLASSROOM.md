# Migracion a Supabase y Google Classroom

## Objetivo

La arquitectura propuesta separa responsabilidades:

- Supabase guarda perfiles, sesiones, progreso, partidas, logros y errores.
- Classroom aporta cursos, profesores y alumnos.
- Apps Script actua temporalmente como puente autorizado con Classroom.
- Sheets queda como exportacion o copia de seguridad, no como base de datos principal.
- El portal y los juegos se trasladaran despues a alojamiento estatico para eliminar
  el tiempo de arranque de las paginas de Apps Script.

La migracion debe ser gradual. La version publica actual no cambia hasta comprobar
que Supabase contiene los mismos resultados que Sheets.

## Por que Classroom puede funcionar sin acceso a la consola de Cloud

El proyecto usa el servicio avanzado de Classroom dentro de Apps Script. Cuando un
script utiliza su proyecto de Cloud predeterminado, Apps Script activa la API al
anadir el servicio. No es necesario entrar manualmente en Google Cloud Console.

El profesor propietario tendra que conceder una autorizacion inicial de Google.
Si el administrador del centro ha bloqueado tambien los permisos de Classroom, la
prueba devolvera un error y habra que pedirle que autorice esos permisos.

## Prueba de acceso a Classroom

1. Publicar o subir el proyecto con el servicio avanzado configurado.
2. Abrir el editor de Apps Script.
3. Seleccionar `testClassroomAccess_`.
4. Ejecutarla y aceptar la autorizacion solicitada.
5. Comprobar que devuelve los cursos activos donde la cuenta es profesora.
6. Copiar el ID de un curso y ejecutar `previewClassroomRoster_('ID_DEL_CURSO')`.
7. Confirmar que aparecen los alumnos y sus correos institucionales.

Las dos funciones son privadas y no pueden ejecutarse desde las paginas publicas.
No escriben ni modifican datos de Classroom.

## Notas de Classroom

La API de Classroom no permite modificar directamente la nota global de una
asignatura. Las notas se escriben sobre entregas de tareas concretas.

Por eso cada vinculacion de notas necesita:

- un curso de Classroom;
- una tarea de Classroom;
- un juego o criterio de LenguArcade;
- una puntuacion maxima;
- elegir si se envia como borrador o como nota asignada.

La tabla `classroom_grade_mappings` conserva esa relacion. La tabla
`grade_sync_queue` contiene las notas pendientes de enviar. El puente de Classroom
procesara la cola con la autorizacion del profesor y registrara cualquier error.

Las notas se enviaran primero como borrador. El modo de nota asignada solo se
activara expresamente para cada tarea.

## Preparacion de Supabase

1. Crear un proyecto en la region europea mas cercana, preferiblemente Frankfurt.
2. Abrir el editor SQL.
3. Ejecutar `supabase/migrations/202606120001_initial_lenguarcade.sql`.
4. Activar el acceso anonimo de Supabase Auth para poder mantener el login actual
   por correo institucional y PIN mediante una Edge Function segura.
5. Guardar `Project URL` y la clave publica o `publishable key`.
6. No copiar nunca la clave `service_role` al HTML, GitHub ni esta conversacion.

El PIN se guardara como hash en `private.profile_secrets`. El navegador no puede
leer esa tabla. Una Edge Function verificara el PIN y creara una sesion breve
asociada al perfil correcto.

La primera version de esa funcion esta en
`supabase/functions/pin-login/index.ts`. Requiere activar el acceso anonimo en
Supabase Auth, porque cada navegador necesita una identidad tecnica antes de
vincularla temporalmente con el alumno que ha demostrado conocer su PIN.

## Seguridad

- RLS esta activado en todas las tablas de datos.
- Un alumno solo puede leer su perfil, progreso, logros y partidas.
- Un profesor solo puede leer alumnos de sus clases.
- Los checkpoints pueden escribirse por el alumno.
- El progreso evaluable, los logros y las notas se escriben desde un backend
  confiable para impedir que el navegador invente puntuaciones.
- La clave `service_role` solo debe existir como secreto de Edge Functions.

## Fases

1. Crear Supabase y aplicar el esquema.
2. Verificar el acceso de Apps Script a Classroom.
3. Importar cursos y alumnos de Classroom a Supabase.
4. Implementar login por correo y PIN con sesion de Supabase.
5. Escribir simultaneamente en Sheets y Supabase.
6. Comparar resultados y cambiar las lecturas del alumno y profesor a Supabase.
7. Alojar el portal fuera de Apps Script.
8. Activar la sincronizacion de notas por tarea de Classroom.
9. Mantener Sheets solo como exportacion administrativa.

## Datos necesarios para continuar

- `Project URL` de Supabase.
- `publishable key` de Supabase.
- resultado de ejecutar `testClassroomAccess_`.

No se necesita compartir ninguna clave privada.
