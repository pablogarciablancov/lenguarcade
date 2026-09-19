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
