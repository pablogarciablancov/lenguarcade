# Lexaria

Prototipo de autobattler educativo de criaturas para LenguArcade.

## Identidad de trabajo

- Juego: **Lexaria**
- Criaturas: **Lexarios**
- Moneda de partida: **Tinta**
- Colección: **Lexipedia**
- Mejoras persistentes de la liga: **Reliquias**
- Consumibles de mercado: **Recursos**
- Variante excepcional: **Cromática**

Todos estos nombres están aislados del núcleo de LenguArcade y se pueden cambiar antes de la integración final.

## Bucle de juego

1. Elegir entrenador.
2. Comprar Lexarios en un mercado de cinco huecos.
3. Colocarlos en un tablero 3x2 y una reserva de cuatro huecos.
4. Fusionar copias para subir de nivel y obtener Reliquias.
5. Entrenar criaturas resolviendo preguntas lingüísticas para mejorar sus estadísticas durante toda la liga.
6. Combatir automáticamente contra formaciones generadas.
7. Alcanzar 10 victorias antes de quedarse sin vidas.

La tienda no tiene temporizador: el ritmo es deliberadamente pausado para que el alumno pueda leer habilidades, estudiar sinergias y responder a los entrenamientos sin presión.

## Contenido actual

- 30 Lexarios originales.
- 8 entrenadores.
- 15 Reliquias.
- 10 Recursos.
- 20 logros globales.
- Tres insignias por criatura en la Lexipedia: campeón, campeón a nivel 3+ y campeón con variante cromática.
- Seis disciplinas: Ortografía, Verbos, Léxico, Morfología, Sintaxis y Literatura.
- Preguntas generadas combinando bancos y variantes para evitar repeticiones rápidas.
- Mercado, bloqueo, cambios, fusiones 3x nivel 1 -> nivel 2 y 2x nivel 2 -> nivel 3.
- Combate automático con vida compartida, escudo, curación, quemadura, veneno, descarga, enfriamientos, adyacencia y muerte súbita.
- Eventos especiales de liga, historial local y guardado.
- Adaptador postMessage preparado para el runner de LenguArcade.

## Estado

Laboratorio. El multijugador asíncrono real no está implementado todavía: los rivales son formaciones generadas localmente. La arquitectura deja el estado de formación serializable para añadir fantasmas de otros alumnos en una integración posterior con Supabase.

## Propiedad intelectual

El proyecto reproduce ideas de diseño y un bucle de género, pero no incluye código, imágenes, audio, nombres de criaturas, textos, interfaz exacta ni recursos artísticos de Batomon Showdown. La identidad visual y el contenido de Lexaria son originales para LenguArcade.
