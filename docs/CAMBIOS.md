# Registro de cambios

## 2026-06-11 - Selector modal de avatar y paisaje

- Las galerías completas del perfil se sustituyeron por un selector compacto con flechas.
- La personalización se abre en una ventana modal y muestra una única vista previa grande.
- El personaje y el paisaje se recorren por separado, con nombre y contador de opción.
- Se mantienen las 16 opciones de personaje, los 12 paisajes, la combinación aleatoria y el guardado existente.
- Cancelar o cerrar la ventana descarta la vista previa y conserva el avatar guardado.
- No se modificaron los datos, el acceso, el progreso, los juegos ni el panel del profesor.

## 2026-06-10 - Galería de 16 avatares y 12 escenarios

- El constructor por colores se sustituyó por 16 personajes masculinos completos con estética pixel art uniforme.
- Se añadieron 12 fondos independientes: montañas, castillo, volcán, bosque mágico, nieve, costa, ruinas, ciudad nocturna, arcade, biblioteca, islas flotantes y pueblo otoñal.
- Cualquier personaje se puede combinar con cualquier escenario desde dos galerías visuales.
- La cabecera y la vista previa componen el fondo y el personaje en capas.
- Los recursos están optimizados en WebP y se sirven desde `lenguarcade-assets`.
- La configuración se guarda como `{version:2, character, background}` en la misma columna `avatar`.
- Los identificadores antiguos y las configuraciones del constructor anterior se convierten automáticamente.
- No se modificaron el acceso, el progreso, las notas, los juegos ni el panel del profesor.

## 2026-06-10 - Acceso institucional y sprite refinado

- La página del alumno se oculta hasta validar una sesión.
- La pantalla inicial solicita el correo completo `@alumno.fomento.edu` y el PIN personal.
- Se eliminaron de la experiencia pública los selectores de clases y alumnos.
- Las antiguas funciones públicas de listado de alumnos quedan desactivadas para impedir enumeraciones.
- Los errores de acceso son genéricos, se limitan los intentos fallidos y, cuando Apps Script identifica una cuenta escolar de Google, se exige que coincida con el correo introducido.
- El avatar se redibujó con una cuadrícula de mayor resolución, rostro y cuerpo más proporcionados, pelo por mechones, chaqueta abierta, pantalones y botas detallados.
- El personaje predeterminado usa pelo castaño despeinado, piel clara, chaqueta roja y ropa azul para aproximarse a la referencia visual.
- Se mantienen la personalización de colores, peinado y fondo, así como la compatibilidad con configuraciones guardadas.
- No se modificaron el progreso, las notas, los juegos ni el panel del profesor.

## 2026-06-10 - Constructor de avatares pixel art

- Se añadió al perfil del alumno un constructor de personajes de cuerpo entero con estética de videojuego de 16 bits.
- Se pueden combinar tono de piel, peinado, color de pelo, color de ojos, chaqueta, camiseta, pantalón y escenario.
- La vista previa se dibuja por capas en un `canvas` de baja resolución para conservar píxeles nítidos al ampliarlo.
- Se añadió un botón para generar combinaciones aleatorias.
- La configuración se guarda como JSON en la columna `avatar` de la hoja `Alumnos` y reaparece en la cabecera y entre sesiones.
- Los antiguos identificadores `avatar_01` a `avatar_12` se convierten automáticamente a una combinación compatible.
- El servidor exige una sesión de alumno y valida cada opción contra una lista cerrada.
- No se modificaron el PIN, el progreso, las notas ni la evaluación.

## 2026-06-09 - Nueva identidad visual y portadas

- Se sustituyeron los siete banners provisionales por portadas JPG 16:9 con estética de biblioteca de videojuegos.
- Se añadió un nuevo emblema de LenguArcade y un banner general del universo de juegos.
- El banner general se refinó con una composición pixel art centrada en una plaza arcade, sin escenas ni personajes repetidos.
- La vista del alumno muestra la nueva marca en el lateral y en la cabecera.
- La vista del profesor muestra la nueva marca en el lateral y el banner general en la cabecera.
- Se añadió favicon PNG en ambas vistas.
- No se modificó la lógica de datos, autenticación, progreso ni evaluación.

## 2026-06-09 - Verificación y protección del despliegue

- Las rutas públicas de alumno y profesor responden con HTTP 200.
- Las funciones de instalación y reparación ya no son invocables desde el navegador.
- El panel público deja de mostrar la contraseña inicial.
- La lectura del panel del alumno exige sesión.
- El guardado de progreso exige siempre una sesión de alumno válida.
- El selector público de alumnos ya no devuelve correos.
- La comprobación automática valida sintaxis, IDs HTML, contratos cliente-servidor y funciones sensibles.
- El publicador valida el proyecto y fuerza de forma explícita la actualización del manifiesto para evitar versiones vacías.
- Las instalaciones nuevas generan una clave de profesor aleatoria en lugar de usar una contraseña conocida en el código.

## 2026-06-09 - Sincronización con Codex y Apps Script

- Se conectó el repositorio con el proyecto real mediante `clasp`.
- Se añadió el manifiesto `apps-script/appsscript.json`.
- Se restauró desde la versión 7 publicada el parche completo `zz_LenguArcade_v0_3_patch.gs`.
- Se eliminaron dos fragmentos v0.4.1 truncados que no eran código ejecutable completo.
- Se añadió un comando de publicación que actualiza el despliegue estable.
- Se añadieron reglas limitadas de Codex para evitar permisos repetidos en los comandos de instalación, comprobación y publicación.
- No se modificó la lógica funcional publicada ni el repositorio de Battlegrafía.

Prueba:

```powershell
npm.cmd install
npm.cmd run apps:status
```

## v0.1 - Núcleo inicial

Pendiente de subir al repositorio como versión base.

Objetivos:

- estructura central de Apps Script
- panel de alumno
- panel de profesor
- Sheets central
- alumnos demo
- catálogo de juegos
- funciones base de progreso

## Criterio de cambios

Cada cambio debe indicar:

- versión
- archivos modificados
- qué se ha tocado
- qué no se ha tocado
- cómo probarlo
- posibles riesgos
