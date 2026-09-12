#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pre-commit secret-scan — a `git add -A` elleni preventív kapu.
Létrejött: 2026-06-16, miután egy audit egy élő Számlázz.hu API-kulcsot talált
plaintextben, git-be commitolva (a fájl SAJÁT figyelmeztetése ellenére — az
ember-fegyelem elbukott, ezért kell gépi kapu).

Olvassa a staged diff-et (stdin: `git diff --cached -U0`), szkenneli az ADDED
sorokat titok-mintákra. Exit 1 = BLOKK. Exit 0 = tiszta. Exit 2 = önteszt-bukás.

Három detektor-réteg:
  (1) PREFIX — magas bizonyosságú, ismert kulcs-prefixek (ghp_, sk-, AKIA, pit-…).
  (2) KONTEXTUS-ALAPÚ — kulcs/key/token/secret kontextus-szó (±5 ADDED sor ablak,
      code-blokk-barát) + 32+ karakteres TISZTA alfanumerikus string (a Számlázz-típus).
  (3) ENTRÓPIA-ALAPÚ base64 (kontextus-FÜGGETLEN) — 24+ karakteres [A-Za-z0-9+/=]
      token, +/= jelenléttel, Shannon-entrópia ≥ 4.3 bit/char → a címke nélküli
      base64-kódolt kulcsokat is fogja.

KALIBRÁCIÓ (2026-06-16, „a detektor maga is gate" — a tracked korpuszon mérve):
  a naiv, kontextus-FÜGGETLEN pure-alnum entrópia-ág 1107 → szűkítve is 5 hamis-pozitívot
  adott (Google Drive-ID + Apps-Script-ID — strukturálisan azonosak egy kulccsal) → ezért
  a pure-alnum ág KONTEXTUS-KÖTÖTT MARAD (2. réteg), különben fail-closed zaj. A base64-ág
  (+/= marker, entrópia ≥ 4.3) korpusz-FP = 0. A címke-nélküli pure-alnum kulcs maradék-rése
  TUDATOSAN elfogadva (alacsony valószínűség); backstop = az entrópia-audit-Workflow.

Két önvédelem (Detektor-Is-Gate pattern — a detektor maga is gate alá esik):
  (a) ÖNTESZT: a szkennernek blokkolnia KELL dummy-tokeneket — különben néma-zöld.
  (b) KISKAPU: a `# pragma: allowlist secret` sort kihagyja (a biztonsági doksik
      maguk is token-MINTÁKAT tartalmaznak — e nélkül a hook a saját riportjaira riadna)."""
import sys, re, math
from collections import Counter

# 1) Prefix-es minták — ezek MAGAS bizonyosságú titkok
PREFIX = [
    r'ghp_[A-Za-z0-9]{30,}', r'github_pat_[A-Za-z0-9_]{40,}',
    r'sk-[A-Za-z0-9]{20,}', r'sk-proj-[A-Za-z0-9_\-]{20,}',
    r'AKIA[0-9A-Z]{16}', r'AIza[A-Za-z0-9_\-]{30,}',
    r'eyJ[A-Za-z0-9_\-]{15,}\.[A-Za-z0-9_\-]{15,}',          # JWT
    r'pit-[a-z0-9]{20,}', r'xox[baprs]-[A-Za-z0-9-]{10,}',
    r'sk_live_[A-Za-z0-9]{20,}', r'SG\.[A-Za-z0-9_\-]{20,}',
    r'-----BEGIN [A-Z ]*PRIVATE KEY-----',
    r'glpat-[A-Za-z0-9_\-]{20,}',
]
PREFIX_RE = [re.compile(p) for p in PREFIX]

# 2) Prefix-NÉLKÜLI, kontextus-alapú (a Számlázz-kulcs típusa): egy "kulcs/key/token/
#    secret/agent/jelszó" kontextus-szó + egy 32+ karakteres TISZTA alfanumerikus string.
#    A '-'/'_' megszakítja a stringet → a Drive-ID/place_id/widget-ID NEM fog beleesni.
#    A lookbehind a '/._-'-t is kizárja ELŐL → az URL-be ágyazott Drive/Apps-Script-ID
#    (drive.google.com/.../<ID>) NEM esik a kontextus-ablakba (korpusz-kalibráció, 2026-06-16).
CONTEXT_KEY = re.compile(r'(kulcs|api[_-]?key|secret|token|agent[_-]?key|jelsz|passwor[dt]|bearer)', re.I)
LONG_ALNUM  = re.compile(r'(?<![A-Za-z0-9/._\-])[A-Za-z0-9]{32,}(?![A-Za-z0-9])')

# 3) Entrópia-alapú base64 (kontextus-független): +/= padding/plus marker + magas entrópia.
#    A korpusz-kalibráció szerint 0 FP (a markdown '===' / 'onclick=' entrópiája < 4.3).
B64_TOKEN   = re.compile(r'(?<![A-Za-z0-9+/=])[A-Za-z0-9+/=]{24,}(?![A-Za-z0-9+/=])')

def shannon(s):
    if not s:
        return 0.0
    n = len(s)
    return -sum((c / n) * math.log2(c / n) for c in Counter(s).values())

def scan_line(line, recent_key_context):
    if 'pragma: allowlist secret' in line:
        return None                                          # szándékos példa/doksi → kiskapu
    for rx in PREFIX_RE:
        m = rx.search(line)
        if m:
            return ('prefix', m.group(0)[:6] + '…')
    # (2) kontextus-kötött pure-alnum (32+) — a Számlázz-osztály
    m = LONG_ALNUM.search(line)
    if m and (CONTEXT_KEY.search(line) or recent_key_context):
        s = m.group(0)
        if not re.fullmatch(r'[0-9a-fA-F]{32,40}', s):       # tiszta hex (hash/ID) = nem titok
            return ('kontextus', s[:5] + '…')
    # (3) entrópia-alapú base64 (kontextus-független)
    m = B64_TOKEN.search(line)
    if m:
        s = m.group(0)
        if ('+' in s or '=' in s) and not re.fullmatch(r'[0-9a-fA-F=]+', s) and shannon(s) >= 4.3:
            return ('entrópia-b64', s[:5] + '…')
    return None

def selftest():
    """A szkennernek BLOKKOLNIA kell a must_catch-et; ha nem, a regex elromlott → néma-zöld."""
    must_catch = [
        "+ token: ghp_000000000000000000000000000000000xyz",          # pragma: allowlist secret
        "+ kulcs: zzzzdummy1111key2222test3333notreal4444xx",         # pragma: allowlist secret  (Számlázz-forma, NEM valódi kulcs)
        "+   Xq7Tp2Wm9Za+Bc4dEf8/Gh0Ij6Kl3Mn5Op1Qr7Suv==",           # pragma: allowlist secret  (base64-forma, címke NÉLKÜL → entrópia-ág)
    ]
    must_pass = [
        "+ | GHL-location-ID | kRmzfD7Iky5S3oIApXfA |",               # publikus ID (rövid)
        "+ minta: ghp_xxxxEXAMPLExxxx # pragma: allowlist secret",    # kiskapu
        "+ ================================================",         # markdown szeparátor (entrópia ~0)
        "+ Drive: 1AjFSj9kQwErTyUiOpAsDfGhJkLzXcVbNmQwErTy",          # pragma: allowlist secret — publikus Drive-ID, NINCS kontextus → NE fogja (kalibrált döntés)
    ]
    for l in must_catch:
        ctx = bool(CONTEXT_KEY.search(l))
        if scan_line(l[1:], ctx) is None:
            sys.stderr.write("secret-scan ÖNTESZT BUKOTT (must_catch nem fogott) — a szken NEM véd!\n"); sys.exit(2)
    for l in must_pass:
        if scan_line(l[1:], False) is not None:
            sys.stderr.write("secret-scan ÖNTESZT BUKOTT (must_pass hamis-pozitív)\n"); sys.exit(2)

def main():
    selftest()
    hits, recent = [], 0
    for raw in sys.stdin:
        if not raw.startswith('+') or raw.startswith('+++'):
            continue
        line = raw[1:]
        r = scan_line(line, recent > 0)
        if r:
            hits.append((r[0], r[1], line.strip()[:55]))
        if CONTEXT_KEY.search(line):
            recent = 5                                        # a kontextus „forró" marad 5 ADDED sorig (code-blokk-barát)
        elif recent > 0:
            recent -= 1
    if hits:
        sys.stderr.write("\n\033[31m🔴 PRE-COMMIT BLOKK — titok-gyanú a staged változásban:\033[0m\n")
        for typ, masked, ctx in hits:
            sys.stderr.write(f"  [{typ}] {masked}  ←  {ctx}\n")
        sys.stderr.write("\n  SZÁNDÉKOS példa/doksi?  → a sor végére: # pragma: allowlist secret\n")
        sys.stderr.write("  ÉLŐ titok?              → ki a fájlból (1Password / ~/.config), NE commitold.\n")
        sys.stderr.write("  Vész-megkerülés:         git commit --no-verify  (NE használd élő titokra!)\n\n")
        sys.exit(1)
    sys.exit(0)

main()
