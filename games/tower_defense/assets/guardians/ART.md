# Recursos pixel art

Generados con la herramienta integrada image_gen; preparados como PNG con alfa. Recursos finales en esta carpeta: `custodio-0.png`…`custodio-5.png`, equivalentes de arquera/mago/vigia, `portrait-*.png` y `storm.png`, `bind.png`, `ward.png`.

Los seis fotogramas por personaje representan reposo, respiración, preparación, ataque, impacto y agotamiento. Cada archivo de animación tiene un lienzo de 192×128 con los pies en (96,120), escala constante por personaje y márgenes transparentes. Los personajes se aislaron por componentes conectados, evitando que un arma extendida del vecino entrase en otro fotograma. Los retratos tienen un lienzo propio de 144×144.

## Prompts utilizados

Plantilla común de los cuatro personajes:

> Use case: stylized-concept. Asset: production pixel art animated unit sprites for medieval fantasy tower defense Guardianes de la Biblioteca. [Subject below] Strict layout: exactly SIX full-body sprites of SAME character in a regular 3 columns x 2 rows grid on transparent background, equal sized cells, every sprite entirely inside its cell with huge empty transparent gutters; feet at same relative baseline and same scale, no overlap. Three-quarter view facing right, readable at 36px tall. Crisp handcrafted 16-bit pixel art, hard square pixel edges, limited rich palette, dark outlines, no smooth digital painting, no text, no labels, no backgrounds, no interface, no frame. All weapons and effects stay inside cell. Canvas landscape 3:2.

Sujetos:

- Custodio: A stocky armored library knight, blue steel armor, ivory parchment cape, enormous closed brown leather book as shield, small gold warhammer. Six poses: idle standing; idle breathing; hammer raised; hammer swing; hit recoil; kneeling tired.
- Arquera: An emerald hooded female archer, brown leather boots, quiver of feather quills, elegant golden bow. Six poses: idle standing; idle breathing; drawing bow; releasing arrow; hit recoil; kneeling tired.
- Mago: An elderly purple robed ink wizard, white beard, tall slightly bent hat, staff holding floating blue ink orb. Six poses: idle standing; idle breathing; staff raised; casting blue ink; hit recoil; kneeling tired.
- Vigía: A golden hooded mysterious watchman in a cape made of parchment pages, brown boots, carrying a turquoise magical lantern. Six poses: idle standing; idle breathing; raising lantern; casting a small cyan wave; hit recoil; kneeling tired.

Plantilla común de los iconos:

> Use case: stylized-concept. One single isolated production game ability icon: [Subject below]. Crisp handcrafted 16-bit pixel art, hard square pixel edges, dark navy outline, rich restricted palette, medieval fantasy library tower defense game. Centered object filling 75% canvas, transparent background, no text, no frame, no interface, no other objects. Readable at 40x40 pixels.

- storm: An explosive glass ink flask bursting with blue ink and small golden sparks, instantly readable explosion silhouette
- bind: A golden hourglass with luminous turquoise sand and two small magical chain links
- ward: An ivory open book with a blue shield and small warm green healing glow
