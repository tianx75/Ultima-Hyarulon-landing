#!/usr/bin/env python3
"""Ár-kapu a maszk-oldalakhoz (2026-11-25).

Élesítés előtt futtasd:   python3 scripts/ar-kapu.py
A kupon lenyomatát is:    MASK_KUPON=<kód> python3 scripts/ar-kapu.py
Másik mappát (pl. régi állapot, pozitív kontroll):  --konyvtar <mappa>

Kilépési kód: 0 = élesíthető · 1 = hiba vagy még nem élesíthető.
A kód maga soha nem kerül a repóba (a repó nyilvános).
"""
import hashlib
import os
import re
import sys

args = sys.argv[1:]
gyoker = args[args.index("--konyvtar") + 1] if "--konyvtar" in args else os.path.join(os.path.dirname(__file__), "..")
gyoker = os.path.abspath(gyoker)

hibak, figyelmeztetesek, rendben = [], [], []


def olvas(nev):
    ut = os.path.join(gyoker, nev)
    if not os.path.exists(ut):
        hibak.append(f"hiányzik: {nev}")
        return ""
    with open(ut, encoding="utf-8") as f:
        return f.read()


def ft(n):
    return f"{n:,}".replace(",", ".") + " Ft"


# ── 1. A konfiguráció (mask-ar.js) ──
cfg = olvas("mask-ar.js")


def szam(kulcs):
    m = re.search(rf"\b{kulcs}:\s*(\d+)", cfg)
    return int(m.group(1)) if m else None


nyilv, kupon, szall, eredeti = szam("nyilvanos"), szam("kuponos"), szam("szallitas"), szam("eredeti")
m_lenyomat = re.search(r"kuponLenyomat:\s*'([0-9a-f]{64})'", cfg)
lenyomat = m_lenyomat.group(1) if m_lenyomat else None
athuzott = re.search(r"athuzottEredetiAr:\s*(true|false)", cfg)
linkek = dict(re.findall(r"\b(klinika|szallitas):\s*'([^']*)'", cfg))

if cfg:
    if None in (nyilv, kupon, szall, eredeti) or not lenyomat or not athuzott:
        hibak.append("mask-ar.js: hiányzik egy ár, a kupon lenyomata vagy az áthúzás-kapcsoló")
    else:
        rendben.append(f"konfiguráció: nyilvános {ft(nyilv)} · kuponos {ft(kupon)} · szállítás {ft(szall)}")
        if not kupon < nyilv:
            hibak.append("a kuponos ár nem kisebb a nyilvánosnál")
        if athuzott.group(1) == "true":
            figyelmeztetesek.append("az áthúzott 120.000 Ft BE van kapcsolva — csak Vanda igenje után élesíthető")

# ── 2. Tiltott maradványok (régi ár, influenszer-kedvezmény, régi Stripe-linkek) ──
oldalak = ["rendeles.html", "maszk.html", "aszf-webshop.html", "koszonjuk.html", "mask-ar.js", "maszk.js"]
engedett = {"maszk.html": ["120.000–180.000 Ft"]}   # a piaci összehasonlító oszlop, nem a mi árunk
tiltott = [r"102[.\s]?000", r"ULTIMA15", r"influencer_ref=", r"14A3cx8hl3h91hudv72B201",
           r"28E28tdBFbNFgco4YB2B202", r"7sYdRb8hlg3V0dqdv72B203", r"6oU3cx415bNFbW89eR2B204"]
tartalom = {o: olvas(o) for o in oldalak}
for o, s in tartalom.items():
    vizsgalt = s
    for e in engedett.get(o, []):
        vizsgalt = vizsgalt.replace(e, "")
    # a konfigurációban az eredeti ár szándékosan szerepel
    tiltott_o = tiltott if o == "mask-ar.js" else tiltott + [r"120[.\s]?000"]
    for minta in tiltott_o:
        talalat = re.findall(minta, vizsgalt)
        if talalat:
            hibak.append(f"{o}: régi elem maradt ({minta}) × {len(talalat)}")

# ── 3. A Google-nak szóló gépi ár és a látható árak ──
if nyilv:
    m = re.search(r'"price":\s*"(\d+)"', tartalom["maszk.html"])
    if not m or int(m.group(1)) != nyilv:
        hibak.append(f"maszk.html: a gépi ár (JSON-LD) {m.group(1) if m else 'nincs'}, nem {nyilv}")
    else:
        rendben.append(f"maszk.html: a gépi ár {nyilv}")
    elvart = {"maszk.html": 3, "rendeles.html": 3, "aszf-webshop.html": 1}
    for o, db in elvart.items():
        n = tartalom[o].count(ft(nyilv)) + tartalom[o].count(ft(nyilv).replace(" Ft", " <small>Ft</small>"))
        (rendben if n >= db else hibak).append(f"{o}: a látható nyilvános ár {n}× (elvárt ≥ {db})")
    if kupon and ft(kupon).replace(" Ft", " <small>Ft</small>") not in tartalom["rendeles.html"]:
        hibak.append("rendeles.html: a kuponos ár kártyája nem a konfiguráció szerinti")

# ── 4. Mindkét oldal betölti a konfigurációt ──
for o in ("rendeles.html", "maszk.html"):
    if '<script src="mask-ar.js"></script>' not in tartalom[o]:
        hibak.append(f"{o}: nem tölti be a mask-ar.js-t")

# ── 5. A kupon lenyomata ──
kod = os.environ.get("MASK_KUPON", "")
if kod and lenyomat:
    norm = re.sub(r"[^A-Z0-9]", "", kod.strip().upper())
    if hashlib.sha256(norm.encode()).hexdigest() == lenyomat:
        rendben.append(f"a kupon lenyomata egyezik ({norm})")
    else:
        hibak.append("a megadott kupon lenyomata NEM egyezik a mask-ar.js-belivel")
elif lenyomat:
    figyelmeztetesek.append("a kupon lenyomatát nem ellenőriztem (MASK_KUPON nincs megadva)")

# ── 6. Stripe-linkek ──
if cfg:
    hianyzo = [k for k in ("klinika", "szallitas") if not linkek.get(k, "").startswith("https://buy.stripe.com/")]
    if hianyzo:
        hibak.append("NEM ÉLESÍTHETŐ: a Stripe-link még helyőrző: " + ", ".join(hianyzo))
    else:
        rendben.append("Stripe-linkek beírva (klinika, szállítás)")

print(f"Ár-kapu — {gyoker}")
for r in rendben:
    print("  ✓", r)
for f in figyelmeztetesek:
    print("  ⚠", f)
for h in hibak:
    print("  ✗", h)
print("EREDMÉNY:", "ÉLESÍTHETŐ" if not hibak else f"{len(hibak)} akadály")
sys.exit(1 if hibak else 0)
