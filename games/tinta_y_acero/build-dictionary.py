"""Generate the exact NFC, 2–9 letter subset of the existing licensed bank."""
from pathlib import Path
import re
import unicodedata
here = Path(__file__).resolve().parent
source = here.parent / 'forja' / 'dictionary-es-extra.txt'
words = {unicodedata.normalize('NFC', w.strip()) for w in source.read_text().splitlines()}
words = sorted(w for w in words if re.fullmatch('[a-záéíóúüñ]{2,9}', w))
(here / 'words.txt').write_text('\n'.join(words) + '\n')
print(f'{len(words)} formas; fuente RLA-ES expandida en Forja; licencia en assets/RLA_ES_LICENSE.md')
