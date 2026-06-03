# Instalación de LenguArcade

## Objetivo de esta versión

Esta estructura prepara el repositorio para trabajar de forma ordenada y automática.

La instalación funcional en Google Apps Script se hará con los archivos de `apps-script/`:

- `LenguArcade_Code.gs`
- `LenguArcade_Alumno.html`
- `LenguArcade_Profesor.html`

## Pasos previstos

1. Crear un proyecto nuevo de Google Apps Script.
2. Crear los archivos anteriores con el mismo nombre.
3. Ejecutar `setupLenguArcade()`.
4. Autorizar permisos.
5. Desplegar como aplicación web.
6. Abrir:

```text
URL_WEBAPP?page=alumno
URL_WEBAPP?page=profesor
```

## Backend

La decisión técnica del proyecto es usar un único Google Sheets central para todo el progreso:

```text
LenguArcade_DB
```

## Alumnos de prueba

El sistema debe poder generar alumnos ficticios para:

- 1º ESO A
- 1º ESO B
- 2º ESO A
- 2º ESO B
- 3º ESO A
- 3º ESO B
- 4º ESO A
- 4º ESO B

Con máximo 30 alumnos por clase y correos terminados en:

```text
@alumno.fomento.edu
```

## Próximo hito

Subir al repositorio el núcleo funcional `v0.1` y probarlo en Apps Script antes de integrar juegos reales.
