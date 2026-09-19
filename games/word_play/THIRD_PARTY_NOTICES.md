# Word Play · avisos de terceros

## Léxico de frecuencia en español

El archivo `dictionary-es-50k.txt` se genera a partir de:

- Proyecto: **FrequencyWords**, de hermitdave.
- Fuente concreta: `content/2018/es/es_50k.txt`.
- Corpus de origen: OpenSubtitles 2018.
- Licencia del contenido: **CC BY-SA 4.0**.
- Repositorio: https://github.com/hermitdave/FrequencyWords

Para Word Play se conserva únicamente la primera columna (la forma léxica) y se eliminan las frecuencias. El archivo se usa como léxico local del juego y se complementa con una capa ortográfica propia para español de España en `lexicon.js`.

La presencia de una forma en el corpus de frecuencia no implica por sí sola que sea una recomendación normativa. Word Play aplica filtros escolares y correcciones ortográficas adicionales antes de aceptar determinadas formas.


## Corrector morfológico español RLA-ES / Hunspell

Word Play incorpora localmente los archivos `hunspell/es_ES.aff` y `hunspell/es_ES.dic`, procedentes del diccionario español de **RLA-ES (Recursos Lingüísticos Abiertos del Español)**, distribuido también a través del repositorio de diccionarios de LibreOffice.

- Proyecto original: https://github.com/sbosio/rla-es
- Repositorio de distribución: https://github.com/LibreOffice/dictionaries
- Variante utilizada: `es_ES`
- Licencia: elección entre **GPL v3+**, **LGPL v3+** o **MPL 1.1+**.
- Copia de la licencia incluida en `hunspell/RLA_ES_LICENSE.md`.

Estos archivos contienen lemas y reglas Hunspell de prefijación, sufijación, flexión y derivación. Word Play los utiliza como capa morfológica para reconocer formas como conjugaciones verbales, plurales, femeninos y derivaciones productivas admitidas por el diccionario.

## Typo.js

Para interpretar las reglas Hunspell en el navegador se incluye **Typo.js**, de Christopher Finke.

- Proyecto: https://github.com/cfinke/Typo.js
- Licencia: Modified BSD.
- Copia de la licencia incluida en `vendor/TYPO_LICENSE.txt`.

La validación de Word Play aplica antes sus filtros escolares y sus correcciones ortográficas específicas; Hunspell amplía la cobertura morfológica, pero no sustituye esos filtros.
