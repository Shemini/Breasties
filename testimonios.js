/*
  OPINIONES
  ----------------------------------------------------------------------
  1) TESTIMONIOS: opiniones que os mandan directamente. Añadid aquí solo
     opiniones reales y con permiso de la persona (usad nombre de pila o
     iniciales). Si mencionan temas de salud, el permiso debe ser explícito.
     Mientras la lista tenga solo los ejemplos, se ven marcados como "ejemplo".
  2) GOOGLE: si rellenáis googlePlaceId y googleApiKey en config.js, se
     cargan también las reseñas de vuestro Perfil de Empresa (Google entrega
     como máximo 5) y se muestran con el diseño de la web, con su autora y
     el enlace a Google como exige Google.
*/
window.TESTIMONIOS = [
  { texto: "Texto de ejemplo: aquí aparecerá lo que nos cuente una familia sobre la consulta.", autora: "Nombre de ejemplo", detalle: "Consulta inicial de lactancia", ejemplo: true },
  { texto: "Texto de ejemplo: sustituye estas frases por opiniones reales en testimonios.js.", autora: "Nombre de ejemplo", detalle: "Preparación del parto", ejemplo: true },
  { texto: "Texto de ejemplo: cuando tengáis opiniones en Google, también aparecerán aquí.", autora: "Nombre de ejemplo", detalle: "Asesoría de porteo", ejemplo: true }
];

(function () {
  if (typeof document === "undefined") return;
  var cfg = window.CONFIG || {};
  var lista = document.getElementById("lista-opiniones");
  if (!lista) return;

  function el(tag, attrs, hijos) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (hijos || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function corazones(n) {
    var c = el("span", { class: "puntuacion", role: "img", "aria-label": n + " de 5" });
    for (var i = 1; i <= 5; i++) c.appendChild(el("span", { class: i <= n ? "lleno" : "vacio", "aria-hidden": "true", text: "♥" }));
    return c;
  }
  function tarjeta(o) {
    var pie = [el("span", { class: "autora", text: o.autora })];
    if (o.detalle) pie.push(el("span", { class: "detalle", text: o.detalle }));
    if (o.google) {
      var a = el("a", { href: o.enlace || "#", target: "_blank", rel: "noopener", class: "fuente", text: "Opinión en Google" });
      pie.push(a);
    }
    return el("figure", { class: "opinion" + (o.ejemplo ? " ejemplo" : "") }, [
      o.ejemplo ? el("span", { class: "marca-ejemplo", text: "ejemplo" }) : null,
      o.puntuacion ? corazones(o.puntuacion) : null,
      el("blockquote", { text: o.texto }),
      el("figcaption", {}, pie)
    ]);
  }
  function pintar(opiniones) {
    lista.textContent = "";
    opiniones.forEach(function (o) { lista.appendChild(tarjeta(o)); });
  }

  var propias = (window.TESTIMONIOS || []).slice();
  pintar(propias);

  var opinar = document.getElementById("enlace-opinar");
  if (opinar) {
    if (cfg.googleResenasUrl) opinar.href = cfg.googleResenasUrl;
    else opinar.parentNode.hidden = true;
  }

  // Reseñas de Google con el diseño de la web
  if (!cfg.googlePlaceId || !cfg.googleApiKey) return;
  window.__iniciarOpinionesGoogle = function () {
    google.maps.importLibrary("places").then(function (lib) {
      var lugar = new lib.Place({ id: cfg.googlePlaceId, requestedLanguage: "es" });
      return lugar.fetchFields({ fields: ["reviews", "rating", "userRatingCount", "googleMapsURI"] }).then(function () {
        var deGoogle = (lugar.reviews || []).filter(function (r) { return r.text; }).map(function (r) {
          var autor = r.authorAttribution || {};
          return { texto: r.text, autora: autor.displayName || "Usuario de Google", enlace: autor.uri || lugar.googleMapsURI,
            detalle: r.relativePublishTimeDescription, puntuacion: r.rating, google: true };
        });
        var reales = propias.filter(function (o) { return !o.ejemplo; });
        pintar(deGoogle.concat(reales));
        var resumen = document.getElementById("opiniones-resumen");
        if (resumen && lugar.rating) {
          resumen.textContent = "";
          resumen.appendChild(document.createTextNode(String(lugar.rating).replace(".", ",") + " de 5 en Google · "));
          resumen.appendChild(el("a", { href: lugar.googleMapsURI, target: "_blank", rel: "noopener", text: lugar.userRatingCount + " opiniones" }));
        }
      });
    }).catch(function () { /* si Google falla, se quedan los testimonios propios */ });
  };
  var s = document.createElement("script");
  s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(cfg.googleApiKey) +
    "&v=weekly&loading=async&language=es&callback=__iniciarOpinionesGoogle";
  s.async = true;
  document.head.appendChild(s);
})();
