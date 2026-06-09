# Instalación de LenguArcade

## Requisitos

- Node.js
- Git
- acceso autorizado al proyecto de Apps Script

## Preparación local

```powershell
npm.cmd install
npx.cmd clasp login
npm.cmd run apps:status
```

La autorización de `clasp` solo se repite si Google invalida o revoca la sesión.

## Publicación

```powershell
npm.cmd run apps:publish -- "descripcion del cambio"
```

Este comando:

1. sube `apps-script/`
2. crea una versión inmutable
3. actualiza el despliegue web estable

URL estable:

```text
https://script.google.com/macros/s/AKfycbyYW1m5zkvLc87XHUqCqNZpY59ZVA6wv6GyxqB_g7u19tRbE22eYZINSV7BHZLkbLpa/exec
```

Paneles:

```text
URL_ESTABLE?page=alumno
URL_ESTABLE?page=profesor
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

## Precauciones

- No ejecutar `clasp pull` con cambios locales pendientes.
- No crear despliegues nuevos; actualizar el estable.
- No ejecutar funciones de inicialización o migración sin revisar su efecto sobre la hoja central.
