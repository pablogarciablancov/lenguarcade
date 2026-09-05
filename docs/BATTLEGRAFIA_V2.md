# Battlegrafía 2.0 · Fantasy Arcade

Battlegrafía 2.0 es una **versión paralela** de Battlegrafía integrada en LenguArcade.

## Principio de integración

- La versión estable sigue en `games/battlegrafia/`.
- La versión nueva vive en `games/battlegrafia_v2/`.
- No se sobrescribe ni se elimina ningún archivo de la versión clásica.
- La v2 reutiliza el motor estable completo: combate, modos, héroes, objetos, tienda, reliquias, bancos de preguntas, XP y progresión.
- La v2 usa un `gameId` propio (`battlegrafia_v2`) y claves de almacenamiento propias para evitar colisiones con la versión clásica.

## Estructura de aventura

La campaña conserva exactamente cinco escenarios, cada uno con cinco monstruos y un jefe final.

### Montañas de Lexikon
1. H-Ghoul
2. Vampiro de la V
3. Gargántua G/J
4. Espectro Agudo
5. Serpiente Comata
6. **Lexikon** · jefe

### Castillo de Paper
1. Diacritik
2. Oxiton
3. Llanor
4. Puntor
5. Kalkor
6. **Paper** · jefe

### Ciénaga de Torvax
1. Esdrulia
2. Muxlor
3. Prosodion
4. Zarruk
5. Minotauro
6. **Torvax** · jefe

### Acantilados de Sintaxion
1. Caoskrin
2. Hiatikus
3. Momia
4. Rugiton
5. Zombie
6. **Sintaxion** · jefe

### Volcán de Don Pablo
1. Gravikus
2. Jarkon
3. Ortograf
4. Siseus
5. Cíclope
6. **Don Pablo** · jefe final

Todos utilizan los sprites originales de `BATTLEGRAFIA-FINAL`.

## Capa visual v2

La nueva presentación añade:

- portada/hub con enfoque de videojuego y acceso directo a Jugar, Perfil, Bestiario, Mercader y Logros;
- selector de modos más visual;
- arena de combate a pantalla completa, optimizada para Chromebook;
- HUD compacto;
- sprites del héroe y monstruo con mayor presencia;
- riel superior de mundo con los seis enemigos del escenario y estado de progreso;
- roster visual de los seis monstruos en el mapa;
- presentación breve especial al llegar a cada jefe;
- campamento, mapa, inventario, diario e historia rediseñados;
- reducción del texto de interfaz y prioridad a acciones claras;
- eliminación del scroll en las pantallas principales de escritorio siempre que el contenido lo permite.

## Archivos

- `games/battlegrafia_v2/index.html`: copia funcional aislada del motor estable.
- `games/battlegrafia_v2/theme-v2.css`: diseño Fantasy Arcade.
- `games/battlegrafia_v2/enhance-v2.js`: capa de interfaz, roster 5×6, jefes y mejoras de UX.
- `scripts/check-battlegrafia-v2.mjs`: comprobaciones de estructura, aislamiento e integración.
- `supabase/migrations/20260905144700_battlegrafia_v2.sql`: registro del juego en el catálogo Supabase.

## Progreso

Battlegrafía 2.0 aparece en LenguArcade como un juego independiente. Esto permite comparar la versión clásica y la v2 sin que una sobrescriba el progreso de la otra.

Cuando la v2 se considere definitiva, se podrá decidir posteriormente si:
1. se mantiene como edición independiente;
2. se migra el progreso de la clásica;
3. o se convierte en la versión principal.

Ese cambio no forma parte de esta integración.
