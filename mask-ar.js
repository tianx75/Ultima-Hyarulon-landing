/* ═══════════════════════════════════════════════════════════════════
   ULTIMA LED Mask — ÁRAK ÉS HÍRLEVÉL-KUPON, EGY HELYEN
   2026-11-25 · Krisztián + Heni: nyilvános ár 89.900 Ft, kuponos ár 84.900 Ft,
   szállítás 1.990 Ft. Az influenszer-kedvezmény megszűnt.

   Ez a fájl CSAK a rendelőlapot (rendeles.html) szolgálja ki. A termékoldal
   (theultimatebeauty.net/mask) Melindáé; ott az árat ő írja át.

   Árváltozásnál EGYÜTT írandó át:
     ① ez a fájl
     ② a rendeles.html statikus árai (a JS-t nem futtató olvasóknak)
     ③ a Stripe-ban az árak, a linkek és a kupon
     ④ szólni Melindának (termékoldal, ÁSZF, Google Shopping)
   Ellenőrzés: python3 scripts/ar-kapu.py

   A kupont a STRIPE ellenőrzi és vonja le: ez a fájl csak azt dönti el,
   hogy az oldal a kuponos árat mutassa-e. A kód maga nincs a forrásban,
   csak a nagybetűsített kód SHA-256 lenyomata.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var AR = {
    nyilvanos: 89900,
    kuponos: 84900,
    szallitas: 1990,
    eredeti: 120000,
    // Áthúzott 120.000 Ft a nyilvános ár mellett. CSAK Vanda igenje után kapcsolható be
    // (a korábbi árra vonatkozó szabály miatt).
    athuzottEredetiAr: false,
    kuponLenyomat: 'feb7d0b3a456cf7c74556e074f9eb8674976f5acd35b4349027f24ad6e28d605',
    // Stripe fizetési linkek — mindkettőn bekapcsolt kuponmezővel.
    // Amíg itt helyőrző áll, az oldal nem enged fizetni (és nem ír sehová).
    stripe: {
      klinika: 'STRIPE_LINK_KLINIKA',     // 89.900 Ft — klinikai átvétel
      szallitas: 'STRIPE_LINK_SZALLITAS'  // 91.890 Ft — házhozszállítással
    }
  };

  function ft(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Ft';
  }

  // A Stripe a kódot kis- és nagybetűtől függetlenül, csak betűből és számból fogadja el.
  function normalizal(kod) {
    return String(kod || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function lenyomat(szoveg) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(szoveg)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  // Ígéret: a normalizált kód, ha érvényes; különben null.
  function kuponEllenoriz(kod) {
    var k = normalizal(kod);
    if (!k || !window.crypto || !crypto.subtle) return Promise.resolve(null);
    return lenyomat(k).then(function (h) {
      return h === AR.kuponLenyomat ? k : null;
    }).catch(function () { return null; });
  }

  function stripeBekotve() {
    return Object.keys(AR.stripe).every(function (k) {
      return /^https:\/\/buy\.stripe\.com\//.test(AR.stripe[k]);
    });
  }

  function stripeUrl(szallitasMod, email, kupon) {
    var alap = szallitasMod === 'shipping' ? AR.stripe.szallitas : AR.stripe.klinika;
    var p = new URLSearchParams();
    if (email) p.set('prefilled_email', email);
    if (kupon) p.set('prefilled_promo_code', kupon);
    var q = p.toString();
    return alap + (q ? (alap.indexOf('?') > -1 ? '&' : '?') + q : '');
  }

  // A beváltott kupon a munkameneten belül megmarad (termékoldal → rendelőoldal).
  var TAROLO = 'mask_kupon';
  function taroltKupon() {
    try { return sessionStorage.getItem(TAROLO) || ''; } catch (e) { return ''; }
  }
  function kuponTarol(k) {
    try { if (k) sessionStorage.setItem(TAROLO, k); else sessionStorage.removeItem(TAROLO); } catch (e) {}
  }

  // A megszűnt influenszer-rendszer munkamenet-nyomai ne zavarjanak be.
  try {
    ['ultima_ref', 'mask_influencer_ref', 'mask_discount_code'].forEach(function (k) {
      sessionStorage.removeItem(k);
    });
  } catch (e) {}

  window.MASK_AR = AR;
  window.MaskAr = {
    ft: ft,
    normalizal: normalizal,
    kuponEllenoriz: kuponEllenoriz,
    stripeBekotve: stripeBekotve,
    stripeUrl: stripeUrl,
    taroltKupon: taroltKupon,
    kuponTarol: kuponTarol
  };
})();
