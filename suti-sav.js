/* Süti-hozzájárulás a maszk-aldomain oldalain (mask.theultimatebeauty.net).
   A főoldal (theultimatebeauty.net, Melinda) süti-sávjának mása: ugyanaz a szöveg, ugyanaz a két gomb,
   ugyanaz a Google-hozzájárulási alapbeállítás (a mérés alapból tiltva), ugyanaz a tárolási kulcs (cookie_consent).
   Egy eltérés a főoldaltól: itt a Meta-mérőkód közvetlenül van az oldalban, ezért a Meta saját
   hozzájárulás-kapcsolóját is ez kezeli (az oldalban: fbq('consent', ...) a fbq('init') előtt).
   Betöltés: a <head>-ben, MINDEN mérőkód ELŐTT, async/defer nélkül. */
(function () {
  var w = window, d = document, KULCS = 'cookie_consent';
  var igen = false;
  try { igen = localStorage.getItem(KULCS) === 'all'; } catch (e) {}

  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }
  var MIND = { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' };
  gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 });
  if (igen) gtag('consent', 'update', MIND);
  w.tubSutiIgen = igen;

  function tubEvent(name, data) {
    var id = (w.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
    var e = { event: name, event_id: id };
    for (var k in (data || {})) e[k] = data[k];
    w.dataLayer.push(e);
  }

  var CSS =
    '.cookie-banner{position:fixed;left:16px;right:16px;bottom:24px;max-width:420px;box-sizing:border-box;background:#FEFCF9;border:1px solid rgba(42,38,32,0.08);padding:1.5rem;box-shadow:0 20px 60px rgba(0,0,0,0.16);z-index:9999;display:none;flex-direction:column;gap:1rem;font-family:inherit}' +
    '.cookie-banner.show{display:flex;animation:cookie-in .5s cubic-bezier(0.16,1,0.3,1)}' +
    '@keyframes cookie-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}' +
    '.cookie-banner__text{margin:0;font-size:0.8rem;line-height:1.7;color:rgba(42,38,32,0.88)}' +
    '.cookie-banner__text a{color:#806844;border-bottom:1px solid #B89968;text-decoration:none}' +
    '.cookie-banner__actions{display:flex;gap:0.75rem}' +
    '.cookie-banner__btn{flex:1;min-height:42px;padding:0.6rem 1rem;font-family:inherit;font-size:0.82rem;font-weight:500;letter-spacing:0.04em;cursor:pointer;transition:all .2s;border-radius:999px}' +
    '.cookie-banner__btn--accept{background:#B89968;color:#F7F2EB;border:1px solid #B89968}' +
    '.cookie-banner__btn--accept:hover{background:#806844;border-color:#806844}' +
    '.cookie-banner__btn--essential{background:#2A2620;color:#F7F2EB;border:1px solid #2A2620}' +
    '.cookie-banner__btn--essential:hover{background:#3a352e}' +
    '@media (prefers-reduced-motion:reduce){.cookie-banner.show{animation:none}}' +
    '@media (max-width:680px){.cookie-banner{left:12px;right:12px;bottom:12px;max-width:none}.cookie-banner__actions{flex-direction:column}.cookie-banner__actions>*{width:100%}}';

  function sav() {
    var valasztott = false;
    try { valasztott = !!localStorage.getItem(KULCS); } catch (e) {}
    if (valasztott) return;

    var st = d.createElement('style');
    st.textContent = CSS;
    d.head.appendChild(st);

    var b = d.createElement('div');
    b.className = 'cookie-banner';
    b.id = 'cookieBanner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-live', 'polite');
    b.setAttribute('aria-label', 'Cookie tájékoztató');
    b.innerHTML =
      '<p class="cookie-banner__text">Ez az oldal cookie-kat használ a jobb felhasználói élmény érdekében. Részletek az <a href="https://theultimatebeauty.net/adatvedelem" target="_blank" rel="noopener">Adatkezelési tájékoztatóban</a>.</p>' +
      '<div class="cookie-banner__actions">' +
      '<button type="button" class="cookie-banner__btn cookie-banner__btn--accept" id="cookieAccept">Elfogadom</button>' +
      '<button type="button" class="cookie-banner__btn cookie-banner__btn--essential" id="cookieEssential">Csak a szükségesek</button>' +
      '</div>';
    d.body.appendChild(b);
    b.classList.add('show');

    function zar() { b.classList.remove('show'); }
    d.getElementById('cookieAccept').addEventListener('click', function () {
      try { localStorage.setItem(KULCS, 'all'); } catch (e) {}
      gtag('consent', 'update', MIND);
      if (typeof w.fbq === 'function') w.fbq('consent', 'grant');
      tubEvent('cookie_consent', { choice: 'all' });
      zar();
    });
    d.getElementById('cookieEssential').addEventListener('click', function () {
      try { localStorage.setItem(KULCS, 'essential'); } catch (e) {}
      tubEvent('cookie_consent', { choice: 'essential' });
      zar();
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', sav); else sav();
})();
