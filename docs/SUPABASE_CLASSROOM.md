# Migracion a Supabase y Google Classroom

## Objetivo

La arquitectura propuesta separa responsabilidades:

- Supabase guarda perfiles, sesiones, progreso, partidas, logros y errores.
- Classroom aporta cursos, profesores y alumnos.
- Apps Script actua temporalmente como puente autorizado con Classroom.
- Sheets queda como copia de seguridad temporal y futura exportacion administrativa.
- El portal y los juegos se trasladaran despues a alojamiento estatico para eliminar
  el tiempo de arranque de las paginas de Apps Script.

La migracion inicial ya esta aplicada. El alumno y el profesor leen desde
Supabase; las escrituras del alumno se duplican temporalmente en Sheets.

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
6. Abrir el panel del profesor y pulsar `Sincronizar alumnado`.
7. Confirmar que el resumen muestra los cursos y alumnos importados.

Las funciones de diagnostico son privadas. La sincronizacion publica exige una
sesion valida de profesor en Supabase antes de leer Classroom.

## Notas de Classroom

La API de Classroom no permite modificar directamente la nota global de una
asignatura. Las notas se escriben sobre entregas de tareas concretas.

El panel crea o reutiliza una tarea identificada como
`LenguArcade - Progreso general`, con un maximo de 10 puntos. Las calificaciones
se escriben exclusivamente en `draftGrade`: quedan como borradores para que el
profesor pueda revisarlas antes de devolverlas.

## Preparacion de Supabase

El proyecto remoto esta en Frankfurt y se gestiona con Supabase CLI. Las
migraciones de `supabase/migrations/` deben aplicarse en orden y las funciones de
`supabase/functions/` deben desplegarse con verificacion JWT.

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

## Estado

- Supabase creado y migraciones aplicadas.
- Datos iniciales importados desde `LenguArcade_DB`.
- Login de alumno y profesor conectado a Supabase.
- Paneles y fichas detalladas leyendo desde Supabase.
- Guardados del alumno con copia secundaria en Sheets.
- Puente de Classroom implementado para alumnado y notas en borrador.
- Pendiente una unica autorizacion inicial del propietario en Apps Script.

No se debe compartir ninguna clave privada.
