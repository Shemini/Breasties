/*
  CALCULADORA DE RESERVAS
  -----------------------------------------------------------------------
  Aquí están los servicios, los precios y las reglas. Para cambiar un precio
  o una duración, edita los números de SERVICIOS y PACK.

  precio.presencial / precio.online: euros (null = ese formato no se ofrece)
  min: minutos que se reservan en el calendario
*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Reservas = factory();
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DESCUENTO_COMBO = 20;     // € menos al juntar 2 o más servicios en una visita presencial
  var MAX_MINUTOS = 240;        // 4 h: lo que cabe en la franja de mañana (10:00-14:00)
  var SUPLEMENTO_LEJOS = 20;    // desde este suplemento, el margen entre citas sube a 1 h 30 min

  var SERVICIOS = [
    { id: "primera", grupo: "Lactancia", nombre: "Primera consultoría de lactancia",
      min: 120, precio: { presencial: 120, online: 80 },
      detalle: "Valoración completa. Dura entre 1 y 2 horas; se reservan 2." },
    { id: "seguimiento", grupo: "Lactancia", nombre: "Seguimiento de lactancia",
      min: 60, duraciones: [30, 45, 60], precio: { presencial: 60, online: 30 },
      detalle: "Revisión de entre 30 y 60 minutos." },
    { id: "destete", grupo: "Lactancia", nombre: "Plan de destete (primera consulta)",
      min: 120, precio: { presencial: 100, online: 60 },
      detalle: "Primera consulta de 2 horas. Los seguimientos son online (15 min, 20 € cada uno)." },
    { id: "prepLactancia", grupo: "Pre-parto", nombre: "Prepara tu lactancia",
      min: 120, precio: { presencial: 80, online: 50 },
      detalle: "Taller individual de 2 horas." },
    { id: "prepParto", grupo: "Pre-parto", nombre: "Preparación del parto",
      min: 120, precio: { presencial: 80, online: 50 },
      detalle: "Sesión individual de 2 horas." },
    { id: "porteo", grupo: "Pre-parto", nombre: "Asesoría de porteo",
      min: 30, precio: { presencial: 50, online: null },
      detalle: "30 minutos. Solo en persona." }
  ];

  var PACK = {
    id: "pack", nombre: "Pack de preparación a la maternidad",
    min: 270, precio: { presencial: 150, online: null },
    incluye: ["prepLactancia", "prepParto", "porteo"],
    detalle: "Prepara tu lactancia + Preparación del parto + Asesoría de porteo. 4 h 30 min, solo en persona."
  };

  function buscar(id) {
    for (var i = 0; i < SERVICIOS.length; i++) if (SERVICIOS[i].id === id) return SERVICIOS[i];
    return null;
  }

  function fmtEuros(n) {
    return (Math.round(n * 100) / 100).toString().replace(".", ",") + " €";
  }

  function fmtDuracion(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (h === 0) return m + " min";
    if (m === 0) return h + " h";
    return h + " h " + m + " min";
  }

  /*
    estado = {
      modalidad: "presencial" | "online",
      suplemento: número (0, 10, 20, 30) | null (solo online) | undefined (sin elegir zona),
      zona: "nombre del municipio",
      pack: true/false,
      ids: ["primera", ...],
      duraciones: { seguimiento: 45 }
    }
  */
  function calcular(estado) {
    var pres = estado.modalidad === "presencial";
    var modo = pres ? "presencial" : "online";
    var errores = [];
    var lineas = [];
    var items = [];

    if (estado.pack) {
      items = [PACK];
    } else {
      (estado.ids || []).forEach(function (id) {
        var s = buscar(id);
        if (s) items.push(s);
      });
    }
    if (!items.length) errores.push("Elige al menos un servicio.");

    var minutos = 0;
    var subtotal = 0;
    items.forEach(function (s) {
      var precio = s.precio[modo];
      if (precio === null || precio === undefined) {
        errores.push(s.nombre + " solo se ofrece " + (pres ? "online." : "en persona."));
        return;
      }
      var min = s.min;
      if (s.duraciones) {
        var elegido = estado.duraciones && estado.duraciones[s.id];
        if (s.duraciones.indexOf(elegido) !== -1) min = elegido;
      }
      minutos += min;
      subtotal += precio;
      lineas.push({ nombre: s.nombre, minutos: min, precio: precio });
    });

    var suplemento = 0;
    if (pres) {
      if (estado.suplemento === undefined) {
        errores.push("Elige tu municipio o distrito.");
      } else if (estado.suplemento === null) {
        errores.push("Desde tu zona solo ofrecemos consulta online.");
      } else {
        suplemento = estado.suplemento;
      }
    }

    var combinados = !estado.pack && items.length >= 2;
    var descuento = pres && combinados ? DESCUENTO_COMBO : 0;

    if (!estado.pack && minutos > MAX_MINUTOS) {
      errores.push("Estos servicios suman " + fmtDuracion(minutos) + " y no caben en una sola cita (máximo " +
        fmtDuracion(MAX_MINUTOS) + "). Resérvalos en dos citas.");
    }

    var total = subtotal + suplemento - descuento;
    var lejos = pres && suplemento >= SUPLEMENTO_LEJOS;

    var evento;
    if (!pres) evento = "cita-online";
    else if (estado.pack) evento = lejos ? "pack-preparacion-lejos" : "pack-preparacion";
    else evento = lejos ? "cita-presencial-lejos" : "cita-presencial";

    var sugerenciaPack = null;
    if (pres && !estado.pack) {
      var ids = items.map(function (s) { return s.id; });
      var tieneTodo = PACK.incluye.every(function (id) { return ids.indexOf(id) !== -1; });
      if (tieneTodo) sugerenciaPack = { ahorro: total - (PACK.precio.presencial + suplemento) };
    }

    return {
      ok: errores.length === 0,
      errores: errores,
      lineas: lineas,
      minutos: minutos,
      subtotal: subtotal,
      suplemento: suplemento,
      descuento: descuento,
      total: total,
      lejos: lejos,
      evento: evento,
      duracionParam: estado.pack ? null : minutos,
      solo_manana: !estado.pack && minutos > 120,
      sugerenciaPack: sugerenciaPack,
      pack: !!estado.pack,
      modalidad: modo,
      zona: estado.zona || ""
    };
  }

  function notasReserva(res) {
    var nombres = res.lineas.map(function (l) { return l.nombre; }).join("; ");
    var lineas = [
      "Servicios: " + nombres,
      "Modalidad: " + (res.modalidad === "presencial" ? "presencial" + (res.zona ? " (" + res.zona + ")" : "") : "online"),
      "Duración reservada: " + fmtDuracion(res.minutos),
      "Precio estimado: " + fmtEuros(res.total) + " (pago en efectivo o Bizum)"
    ];
    return lineas.join("\n");
  }

  function urlReserva(res, cfg) {
    var base = "https://cal.com/" + cfg.calUsuario + "/" + res.evento;
    var p = new URLSearchParams();
    if (res.duracionParam) p.set("duration", String(res.duracionParam));
    p.set("layout", "month_view");
    p.set("notes", notasReserva(res));
    return base + "?" + p.toString();
  }

  return {
    SERVICIOS: SERVICIOS, PACK: PACK, DESCUENTO_COMBO: DESCUENTO_COMBO,
    calcular: calcular, urlReserva: urlReserva, notasReserva: notasReserva,
    fmtEuros: fmtEuros, fmtDuracion: fmtDuracion
  };
}));

/* ---------------------------------------------------------------------
   Interfaz de la página de reservas (solo se ejecuta en el navegador)
   --------------------------------------------------------------------- */
(function () {
  if (typeof document === "undefined") return;
  var R = window.Reservas;
  var cfg = window.CONFIG || { calUsuario: "TU-USUARIO", whatsapp: "", email: "" };
  var form = document.getElementById("form-reserva");
  if (!form) return;

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }

  // --- Zonas ---
  var zonas = (window.ZONAS || []).slice();
  var selZona = document.getElementById("zona");
  var grpMadrid = el("optgroup", { label: "Madrid capital (distritos)" });
  var grpOtros = el("optgroup", { label: "Otros municipios de la Comunidad de Madrid" });
  zonas.forEach(function (z, i) {
    var etiqueta = z.n + (z.s === null ? " (solo online)" : "");
    var op = el("option", { value: String(i), text: etiqueta });
    (z.n.indexOf("Madrid · ") === 0 ? grpMadrid : grpOtros).appendChild(op);
  });
  selZona.appendChild(grpMadrid);
  selZona.appendChild(grpOtros);

  // --- Servicios ---
  var lista = document.getElementById("lista-servicios");
  var grupoActual = null;
  var contenedor = null;

  function tarjetaServicio(s, esPack) {
    var id = "srv-" + s.id;
    var precios = [];
    if (s.precio.presencial !== null) precios.push("En persona " + R.fmtEuros(s.precio.presencial));
    if (s.precio.online !== null) precios.push("Online " + R.fmtEuros(s.precio.online));
    var cuerpo = [
      el("span", { class: "opcion-titulo", text: s.nombre }),
      el("span", { class: "opcion-detalle", text: s.detalle }),
      el("span", { class: "opcion-precios", text: precios.join(" · ") })
    ];
    var cb = el("input", { type: "checkbox", id: id, name: esPack ? "pack" : "servicio", value: s.id });
    var label = el("label", { class: "opcion", for: id }, [cb, el("span", { class: "opcion-texto" }, cuerpo)]);
    var envoltorio = el("div", { class: "opcion-fila" }, [label]);
    if (s.duraciones) {
      var sel = el("select", { id: "dur-" + s.id, "aria-label": "Duración del seguimiento", class: "dur" });
      s.duraciones.forEach(function (d) {
        var op = el("option", { value: String(d), text: R.fmtDuracion(d) });
        if (d === s.min) op.selected = true;
        sel.appendChild(op);
      });
      envoltorio.appendChild(sel);
    }
    return envoltorio;
  }

  R.SERVICIOS.forEach(function (s) {
    if (s.grupo !== grupoActual) {
      grupoActual = s.grupo;
      contenedor = el("div", { class: "grupo-servicios" }, [el("h3", { text: s.grupo })]);
      lista.appendChild(contenedor);
    }
    contenedor.appendChild(tarjetaServicio(s, false));
  });
  var grupoPack = el("div", { class: "grupo-servicios" }, [el("h3", { text: "Pack" }), tarjetaServicio(R.PACK, true)]);
  lista.appendChild(grupoPack);

  // --- Estado ---
  function leerEstado() {
    var modalidad = form.querySelector('input[name="modalidad"]:checked').value;
    var iz = selZona.value;
    var zona = iz === "" ? null : zonas[Number(iz)];
    var packMarcado = document.getElementById("srv-pack").checked;
    var ids = Array.prototype.map.call(form.querySelectorAll('input[name="servicio"]:checked'), function (c) { return c.value; });
    var sd = document.getElementById("dur-seguimiento");
    return {
      modalidad: modalidad,
      suplemento: zona ? zona.s : undefined,
      zona: zona ? zona.n.replace("Madrid · ", "Madrid, ") : "",
      pack: packMarcado,
      ids: ids,
      duraciones: { seguimiento: sd ? Number(sd.value) : 60 }
    };
  }

  var resumen = document.getElementById("resumen");
  var zonaBloque = document.getElementById("bloque-zona");
  var botonVer = document.getElementById("boton-ver");
  var resultado = document.getElementById("resultado-calendario");

  function actualizar(e) {
    var origen = e && e.target;
    var cbPack = document.getElementById("srv-pack");
    // El pack es incompatible con el resto de servicios sueltos
    if (origen === cbPack && cbPack.checked) {
      form.querySelectorAll('input[name="servicio"]').forEach(function (c) { c.checked = false; });
    } else if (origen && origen.name === "servicio" && origen.checked) {
      cbPack.checked = false;
    }

    var estado = leerEstado();
    var pres = estado.modalidad === "presencial";
    zonaBloque.hidden = !pres;

    // Servicios que solo existen en persona se desactivan en online
    [buscarSrv("porteo"), R.PACK].forEach(function (s) {
      var c = document.getElementById("srv-" + s.id);
      var fila = c.closest(".opcion-fila");
      c.disabled = !pres;
      if (!pres) c.checked = false;
      fila.classList.toggle("desactivada", !pres);
    });
    form.querySelectorAll('input[name="servicio"], input[name="pack"]').forEach(function (c) {
      var fila = c.closest(".opcion-fila");
      var d = fila.querySelector(".dur");
      if (d) d.hidden = !c.checked;
    });

    estado = leerEstado();
    var res = R.calcular(estado);
    pintarResumen(res, estado);
    botonVer.disabled = !res.ok;
    resultado.hidden = true;
  }

  function buscarSrv(id) {
    return R.SERVICIOS.filter(function (s) { return s.id === id; })[0];
  }

  function pintarResumen(res, estado) {
    resumen.textContent = "";
    var hayLineas = res.lineas.length > 0;
    if (hayLineas) {
      var tabla = el("table", { class: "resumen-tabla" });
      res.lineas.forEach(function (l) {
        tabla.appendChild(el("tr", {}, [
          el("td", { text: l.nombre + " (" + R.fmtDuracion(l.minutos) + ")" }),
          el("td", { class: "der", text: R.fmtEuros(l.precio) })
        ]));
      });
      if (res.suplemento > 0) {
        tabla.appendChild(el("tr", {}, [el("td", { text: "Desplazamiento a " + (estado.zona || "tu zona") }), el("td", { class: "der", text: "+ " + R.fmtEuros(res.suplemento) })]));
      }
      if (res.descuento > 0) {
        tabla.appendChild(el("tr", {}, [el("td", { text: "Descuento por juntar servicios en una visita" }), el("td", { class: "der", text: "− " + R.fmtEuros(res.descuento) })]));
      }
      tabla.appendChild(el("tr", { class: "total" }, [
        el("td", { text: "Total estimado · " + R.fmtDuracion(res.minutos) }),
        el("td", { class: "der", text: R.fmtEuros(res.total) })
      ]));
      resumen.appendChild(tabla);
      if (res.solo_manana) resumen.appendChild(el("p", { class: "nota", text: "Por su duración, solo habrá huecos por la mañana." }));
      if (res.sugerenciaPack && res.sugerenciaPack.ahorro > 0) {
        resumen.appendChild(el("p", { class: "nota destacada", text: "Con el pack de preparación a la maternidad ahorras " + R.fmtEuros(res.sugerenciaPack.ahorro) + " con los mismos tres servicios." }));
      }
      resumen.appendChild(el("p", { class: "nota", text: "Pago en efectivo o Bizum. Si la cita es online, antes de la videollamada." }));
    }
    res.errores.forEach(function (m) { resumen.appendChild(el("p", { class: "error", text: m })); });
  }

  form.addEventListener("change", actualizar);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var res = R.calcular(leerEstado());
    if (!res.ok) return;
    var url = R.urlReserva(res, cfg);
    var banner = document.getElementById("banner-duracion");
    banner.textContent = "";
    banner.appendChild(el("strong", { text: "Duración necesaria: " + R.fmtDuracion(res.minutos) + ". " }));
    banner.appendChild(document.createTextNode(res.pack
      ? "Este pack tiene huecos propios de 4 h 30 min."
      : "Comprueba que el calendario muestra esa duración antes de elegir un hueco."));
    document.getElementById("marco-calendario").src = url;
    document.getElementById("abrir-calendario").href = url;
    resultado.hidden = false;
    resultado.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Aviso mientras no se haya configurado Cal.com
  var aviso = document.getElementById("aviso-prueba");
  if (aviso) aviso.hidden = cfg.calUsuario !== "TU-USUARIO";

  // Enlace de WhatsApp para reservas urgentes
  var wa = document.getElementById("whatsapp-urgente");
  if (wa) {
    var texto = "Hola, necesito una cita urgente (en menos de 24 h).";
    wa.href = "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent(texto);
  }

  actualizar();
})();
