/* Bedo & Boda — comportamento del sito.
   Tutto e' un miglioramento progressivo: senza questo file la pagina
   resta completa e leggibile (in italiano). */
(function () {
  'use strict';
  window.__bbOk = true;                       /* segnale per il watchdog in <head> */
  var html = document.documentElement;
  var CHIAVE = 'bb-lingua';
  var riduci = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- formato prezzi ---------- */
  function euro(cent) {
    return (cent / 100).toFixed(2).replace('.', ',') + ' €';
  }

  /* ---------- lingua ---------- */
  function imposta(lingua, salva) {
    if (lingua !== 'ar') lingua = 'it';
    html.lang = lingua;
    html.dir = lingua === 'ar' ? 'rtl' : 'ltr';
    var t = html.getAttribute('data-titolo-' + lingua);
    if (t) document.title = t;
    var bottoni = document.querySelectorAll('[data-lingua]');
    for (var i = 0; i < bottoni.length; i++) {
      bottoni[i].setAttribute('aria-pressed', bottoni[i].getAttribute('data-lingua') === lingua ? 'true' : 'false');
    }
    if (salva) { try { localStorage.setItem(CHIAVE, lingua); } catch (e) {} }
    aggiornaComponi(false);
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-lingua]');
    if (b) imposta(b.getAttribute('data-lingua'), true);
  });

  /* ---------- rivelazioni allo scroll ---------- */
  var rivelabili = document.querySelectorAll('.rivela, .strati');
  function mostraTutto() {
    for (var i = 0; i < rivelabili.length; i++) rivelabili[i].classList.add('visibile');
  }
  if (html.classList.contains('js-anim') && 'IntersectionObserver' in window) {
    var oss = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.classList.add('visibile'); oss.unobserve(v.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    for (var r = 0; r < rivelabili.length; r++) oss.observe(rivelabili[r]);
    /* rete di sicurezza: cio' che e' gia' sullo schermo dopo 2,5 s si mostra comunque */
    setTimeout(function () {
      for (var i = 0; i < rivelabili.length; i++) {
        var b = rivelabili[i].getBoundingClientRect();
        if (b.top < window.innerHeight && b.bottom > 0) rivelabili[i].classList.add('visibile');
      }
    }, 2500);
  } else {
    html.classList.remove('js-anim');
    mostraTutto();
  }
  window.addEventListener('beforeprint', mostraTutto);

  /* hero: le lettere cadono quando i font sono pronti (max 600 ms di attesa) */
  var hero = document.querySelector('.hero');
  if (hero) {
    var partito = false;
    var parti = function () { if (!partito) { partito = true; requestAnimationFrame(function () { hero.classList.add('parti'); }); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(parti);
    setTimeout(parti, 600);
  }

  /* ---------- schede categoria che seguono lo scroll ---------- */
  var pista = document.querySelector('.schede-cat__pista');
  if (pista && 'IntersectionObserver' in window) {
    var link = pista.querySelectorAll('a[href^="#"]');
    var perId = {};
    for (var l = 0; l < link.length; l++) perId[link[l].getAttribute('href').slice(1)] = link[l];
    var attiva = function (id) {
      var a = perId[id];
      if (!a || a.getAttribute('aria-current') === 'true') return;
      for (var k in perId) perId[k].removeAttribute('aria-current');
      a.setAttribute('aria-current', 'true');
      var ra = a.getBoundingClientRect(), rp = pista.getBoundingClientRect();
      var delta = (ra.left + ra.width / 2) - (rp.left + rp.width / 2);
      if (Math.abs(delta) > 4) pista.scrollBy({ left: delta, behavior: riduci ? 'auto' : 'smooth' });
    };
    var spia = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) attiva(v.target.id); });
    }, { rootMargin: '-150px 0px -55% 0px', threshold: 0 });
    var sezioni = document.querySelectorAll('.sezione[id]');
    for (var s = 0; s < sezioni.length; s++) spia.observe(sezioni[s]);
  }

  /* ---------- componi il tuo koshari ---------- */
  var componi = document.querySelector('.componi');
  var cifra = componi && componi.querySelector('.totale__cifra');
  var riepilogo = componi && componi.querySelector('.totale__riepilogo');
  var lettore = componi && componi.querySelector('[data-lettore]');
  var mostrato = null;
  if (componi) componi.hidden = false;      /* il calcolatore esiste solo con JS attivo */

  var giro = 0;                              /* ogni nuova animazione annulla la precedente */
  /* il prezzo cambia subito, al tocco; la barra fa solo un lampo di colore */
  function conta(da, a) {
    giro++;
    cifra.textContent = euro(a);
    if (riduci || da === null) return;
    var barra = cifra.parentNode;
    barra.classList.remove('totale--lampo'); void barra.offsetWidth; barra.classList.add('totale--lampo');
  }

  function aggiornaComponi(anima) {
    if (!componi) return;
    var lingua = html.lang === 'ar' ? 'ar' : 'it';
    var taglia = componi.querySelector('input[name="taglia"]:checked');
    var extra = componi.querySelectorAll('input[name="aggiunta"]:checked');
    var totale = taglia ? +taglia.value : 0;
    var nomi = taglia ? [taglia.getAttribute('data-' + lingua)] : [];
    for (var i = 0; i < extra.length; i++) {
      totale += +extra[i].value;
      nomi.push(extra[i].getAttribute('data-breve-' + lingua));
    }
    riepilogo.textContent = nomi.join(' + ');
    if (lettore) lettore.textContent = nomi.join(' + ') + ': ' + euro(totale);
    if (anima === false) { giro++; cifra.textContent = euro(totale); mostrato = totale; return; }
    if (totale !== mostrato) { conta(mostrato, totale); mostrato = totale; }
  }
  if (componi) {
    componi.addEventListener('change', function () { aggiornaComponi(true); });
    aggiornaComponi(false);
  }

  /* ---------- condividi ---------- */
  var avviso;
  function annuncia(testo, durata) {
    if (!avviso) {
      avviso = document.createElement('div');
      avviso.className = 'avviso';
      avviso.setAttribute('role', 'status');
      document.body.appendChild(avviso);
    }
    avviso.textContent = testo;
    avviso.classList.add('su');
    clearTimeout(avviso._t);
    avviso._t = setTimeout(function () { avviso.classList.remove('su'); }, durata || 2400);
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-condividi]');
    if (!b) return;
    var url = b.getAttribute('data-condividi') || location.href;
    var titolo = document.title;
    if (navigator.share) {
      navigator.share({ title: titolo, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        annuncia(html.lang === 'ar' ? 'تم نسخ الرابط' : 'Link copiato');
      });
    }
  });

  /* ---------- telefono su computer ----------
     Su un PC il link tel: spesso non apre nulla: mostriamo il numero e lo copiamo.
     Su telefono e tablet (dito, niente mouse) il link chiama normalmente. */
  var conMouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="tel:"]');
    if (!a || !conMouse) return;
    ev.preventDefault();
    var numero = a.getAttribute('data-numero') || a.getAttribute('href').slice(4);
    var ar = html.lang === 'ar';
    var testo = (ar ? 'اتصل بينا على ' : 'Chiamaci al ') + '⁦' + numero + '⁩';
    var copiato = ar ? ' — تم نسخ الرقم' : ' — numero copiato';
    var mostra = function (ok) { annuncia(testo + (ok ? copiato : ''), 5000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(numero).then(function () { mostra(true); }, function () { mostra(false); });
    } else { mostra(false); }
  });

  /* ---------- bottone "torna su" ---------- */
  var su = document.querySelector('.su-btn');
  if (su) {
    /* compare dopo un po' di scorrimento, ma si toglie di mezzo quando
       il totale del "Componi" e' incollato in basso (lo coprirebbe) */
    var aggiornaSu = function () {
      var copre = false;
      if (componi && !componi.hidden) {
        var b = componi.getBoundingClientRect();
        copre = b.top < window.innerHeight && b.bottom > 0;
      }
      su.classList.toggle('su', window.scrollY > 900 && !copre);
    };
    window.addEventListener('scroll', aggiornaSu, { passive: true });
    window.addEventListener('resize', aggiornaSu);
    aggiornaSu();
  }

  /* lingua iniziale gia' impostata in <head>: qui si sincronizzano bottoni e titolo */
  imposta(html.lang, false);
})();
