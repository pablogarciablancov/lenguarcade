"""Expand the bundled RLA-ES rules offline; never guess conjugations at runtime.

Run: python games/lexoma/build-dictionary.py [--verify-native]
The optional native check requires libhunspell and tests a deterministic sample.
Only the SET/FLAG/PFX/SFX dialect used by this pinned dictionary is supported.
"""
from pathlib import Path
import re
import sys
import hashlib

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'word_play' / 'hunspell'
VALID = re.compile(r'[a-záéíóúüñ]{2,}')


def read_rules():
    rules = {'PFX': {}, 'SFX': {}}
    cross = {}
    for line in (SOURCE / 'es_ES.aff').read_text(encoding='utf-8').splitlines():
        fields = line.split()
        if not fields or fields[0].startswith('#'):
            continue
        kind = fields[0]
        if kind not in {'SET', 'FLAG', 'TRY', 'REP', 'MAP', 'PFX', 'SFX'}:
            raise ValueError(f'Unsupported Hunspell directive: {line}')
        if kind == 'SET' and fields[1] != 'UTF-8' or kind == 'FLAG' and fields[1] != 'UTF-8':
            raise ValueError('This generator requires UTF-8 words and flags')
        if kind not in rules:
            continue
        flag = fields[1]
        if len(fields) == 4:
            cross[kind, flag] = fields[2] == 'Y'
            rules[kind][flag] = []
        else:
            _, _, remove, append, condition = fields[:5]
            append, _, continuation = append.partition('/')
            pattern = '^' + condition if kind == 'PFX' else condition + '$'
            rules[kind][flag].append((remove if remove != '0' else '', append if append != '0' else '', continuation, re.compile(pattern)))
    return rules, cross


def apply(word, rule, kind):
    remove, append, continuation, condition = rule
    if not condition.search(word):
        return None
    if kind == 'PFX':
        if not word.startswith(remove):
            return None
        return append + word[len(remove):]
    if remove and not word.endswith(remove):
        return None
    return (word[:-len(remove)] if remove else word) + append


def expand(word, flags, rules, cross):
    yield word
    # RLA-ES uses at most two suffixes: derivation followed by GS (gender/plural).
    def suffixes(stem, available, require_cross=False, depth=0):
        if depth > 1:
            raise ValueError('Unexpected continuation depth in source dictionary')
        for flag in available:
            if require_cross and not cross.get(('SFX', flag), False):
                continue
            for rule in rules['SFX'].get(flag, []):
                form = apply(stem, rule, 'SFX')
                if form is not None:
                    yield form
                    if rule[2]:
                        yield from suffixes(form, rule[2], require_cross, depth + 1)
    yield from suffixes(word, flags)
    for flag in flags:
        for rule in rules['PFX'].get(flag, []):
            if rule[2]:
                raise ValueError('Unexpected prefix continuation')
            form = apply(word, rule, 'PFX')
            if form is not None:
                yield form
                if cross['PFX', flag]:
                    yield from suffixes(form, flags, require_cross=True)


def verify_native(words):
    import ctypes
    import ctypes.util
    lib = ctypes.CDLL(ctypes.util.find_library('hunspell-1.7') or 'libhunspell-1.7.so.0')
    lib.Hunspell_create.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
    lib.Hunspell_create.restype = ctypes.c_void_p
    lib.Hunspell_spell.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
    lib.Hunspell_destroy.argtypes = [ctypes.c_void_p]
    handle = lib.Hunspell_create(str(SOURCE / 'es_ES.aff').encode(), str(SOURCE / 'es_ES.dic').encode())
    try:
        sample = words[::max(1, len(words) // 2000)]
        failures = [w for w in sample if not lib.Hunspell_spell(handle, w.encode())]
        if failures:
            raise ValueError(f'Native Hunspell rejects generated words: {failures[:20]}')
        print(f'Native Hunspell verified {len(sample)} generated forms')
    finally:
        lib.Hunspell_destroy(handle)


def main():
    rules, cross = read_rules()
    words = set()
    for line in (SOURCE / 'es_ES.dic').read_text(encoding='utf-8').splitlines()[1:]:
        entry = line.split()[0]
        word, _, flags = entry.partition('/')
        # Preserve the earlier exclusion of proper names, acronyms and punctuation.
        if VALID.fullmatch(word):
            words.update(form for form in expand(word, flags, rules, cross) if VALID.fullmatch(form))
    ordered = sorted(words)
    if '--verify-native' in sys.argv:
        verify_native(ordered)
    output = '\n'.join(ordered) + '\n'
    (HERE / 'dictionary-es-extra.txt').write_text(output, encoding='utf-8')
    print(f'{len(words):,} forms; {len(output.encode()):,} bytes; SHA256 {hashlib.sha256(output.encode()).hexdigest()}')


if __name__ == '__main__':
    main()
