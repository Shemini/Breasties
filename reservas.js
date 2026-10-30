/*
  CALCULADORA DE RESERVAS
  -----------------------------------------------------------------------
  Aquí están los servicios, los precios y las reglas. Para cambiar un precio
  o una duración, edita los números de SERVICIOS y PACK.

  precio.presencial / precio.online: euros (null = ese formato no se ofrece)
  info: texto de la ventana de información (botón «i»)
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
      info: "Una visita tranquila para ver cómo va la lactancia: observamos una toma, revisamos el agarre y la postura, resolvemos tus dudas y preparamos un plan adaptado a vosotros. Suele durar entre 1 y 2 horas; reservamos 2 para ir sin prisas. Incluye un resumen por escrito.",
      detalle: "Valoración completa. Dura entre 1 y 2 horas; se reservan 2." },
    { id: "seguimiento", grupo: "Lactancia", nombre: "Seguimiento de lactancia",
      min: 60, duraciones: [30, 45, 60], precio: { presencial: 60, online: 30 },
      info: "Una revisión después de la primera consultoría para ver cómo evoluciona todo, ajustar el plan y resolver las dudas nuevas. Tú eliges si necesitas 30, 45 o 60 minutos.",
      detalle: "Revisión de entre 30 y 60 minutos." },
    { id: "destete", grupo: "Lactancia", nombre: "Plan de destete",
      min: 120, precio: { presencial: 100, online: 60 },
      info: "Te acompaño a planificar un destete respetuoso, al ritmo que necesitéis tu bebé y tú. La primera consulta dura 2 horas; después hacemos seguimientos online de 15 minutos para ir ajustando el plan.",
      detalle: "Primera consulta de 2 horas y, después, seguimientos online cortos." },
    { id: "prepLactancia", grupo: "Pre-parto", nombre: "Prepara tu lactancia",
      min: 120, precio: { presencial: 80, online: 50 },
      info: "Una sesión individual antes del nacimiento para llegar con información y confianza: cómo funciona la lactancia, las primeras tomas, posturas, señales de hambre y a quién pedir ayuda.",
      detalle: "Taller individual de 2 horas." },
    { id: "prepParto", grupo: "Pre-parto", nombre: "Preparación del parto",
      min: 120, precio: { presencial: 80, online: 50 },
      info: "Una sesión individual para preparar el parto: sus fases, recursos para manejar el dolor, el plan de parto y qué llevar al hospital. Para que llegues tranquila y con tus preguntas resueltas.",
      detalle: "Sesión individual de 2 horas." },
    { id: "porteo", grupo: "Pre-parto", nombre: "Asesoría de porteo",
      min: 30, precio: { presencial: 50, online: null },
      info: "Aprende a elegir y colocar el portabebés con seguridad y comodidad para ti y tu bebé. Es solo presencial, porque hay que probarlo en persona.",
      detalle: "Cómo portear con seguridad y comodidad. 30 minutos." }
  ];

  var PACK = {
    id: "pack", nombre: "Pack de preparación a la maternidad",
    min: 270, precio: { presencial: 150, online: null },
    incluye: ["prepLactancia", "prepParto", "porteo"],
    info: "Las tres sesiones de preparación en una sola visita: Prepara tu lactancia, Preparación del parto y Asesoría de porteo. Dura 4 h 30 min, empieza a las 10:00 y puede terminar a las 14:30. Es solo presencial.",
    detalle: "Prepara tu lactancia, Preparación del parto y Asesoría de porteo en una sola visita de 4 h 30 min."
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
        errores.push("Escribe tu código postal.");
      } else if (estado.suplemento === null) {
        errores.push("En tu zona solo podemos hacer la consulta online.");
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

  function notasReserva(res, extra) {
    var nombres = res.lineas.map(function (l) { return l.nombre; }).join("; ");
    var lineas = [
      "Servicios: " + nombres,
      "Modalidad: " + (res.modalidad === "presencial" ? "presencial" + (res.zona ? " (" + res.zona + ")" : "") : "online"),
      "Duración reservada: " + fmtDuracion(res.minutos),
      "Precio estimado: " + fmtEuros(res.total) + " (pago en efectivo o Bizum)"
    ];
    if (extra && extra.cp) lineas.splice(2, 0, "Código postal: " + extra.cp);
    if (extra && extra.nota) lineas.push("Nota: " + extra.nota);
    return lineas.join("\n");
  }

  function urlReserva(res, cfg, extra) {
    var base = "https://cal.com/" + cfg.calUsuario + "/" + res.evento;
    var p = new URLSearchParams();
    if (res.duracionParam) p.set("duration", String(res.duracionParam));
    p.set("layout", "month_view");
    p.set("notes", notasReserva(res, extra));
    return base + "?" + p.toString();
  }

  function calConfigurado(cfg) {
    return !!(cfg && cfg.calUsuario && cfg.calUsuario !== "TU-USUARIO");
  }

  return {
    calConfigurado: calConfigurado,
    SERVICIOS: SERVICIOS, PACK: PACK, DESCUENTO_COMBO: DESCUENTO_COMBO,
    calcular: calcular, urlReserva: urlReserva, notasReserva: notasReserva,
    fmtEuros: fmtEuros, fmtDuracion: fmtDuracion
  };
}));


/* ---------------------------------------------------------------------
   Reserva paso a paso (solo se ejecuta en el navegador)
   1 Servicios · 2 Modalidad · 3 Código postal · 4 Nota · 5 Resumen y calendario
   --------------------------------------------------------------------- */
(function () {
  if (typeof document === "undefined") return;
  var R = window.Reservas;
  var cfg = window.CONFIG || { calUsuario: "TU-USUARIO", whatsapp: "", email: "" };
  var CP = window.CODIGOS_POSTALES || {};
  var raiz = document.getElementById("reserva");
  if (!raiz) return;

  var CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, hijos) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (hijos || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  var estado = { ids: [], pack: false, durSeg: 60, modalidad: null, cp: "", zona: null, nota: "" };
  var pasoActual = 1;

  function soloPresencial() {
    return estado.pack || estado.ids.indexOf("porteo") !== -1;
  }
  function minutosElegidos() {
    if (estado.pack) return R.PACK.min;
    return estado.ids.reduce(function (t, id) {
      if (id === "seguimiento") return t + estado.durSeg;
      return t + R.SERVICIOS.filter(function (s) { return s.id === id; })[0].min;
    }, 0);
  }
  function estadoCalculo(modalidad, suplemento) {
    return {
      modalidad: modalidad, suplemento: suplemento,
      zona: estado.zona ? estado.zona[0] : "",
      pack: estado.pack, ids: estado.ids.slice(),
      duraciones: { seguimiento: estado.durSeg }
    };
  }
  function pasosVisibles() {
    var p = [1, 2];
    if (estado.modalidad !== "online") p.push(3);
    p.push(4, 5);
    return p;
  }

  // ---------- Paso 1: servicios ----------
  function textoDuracion(s) {
    return s.duraciones ? R.fmtDuracion(s.duraciones[0]) + " a " + R.fmtDuracion(s.duraciones[s.duraciones.length - 1]) : R.fmtDuracion(s.min);
  }
  function tarjeta(s, esPack) {
    var id = "srv-" + s.id;
    var input = el("input", { type: "checkbox", id: id, value: s.id, name: esPack ? "pack" : "servicio" });
    var etiquetas = [el("span", { class: "etiqueta", text: textoDuracion(s) })];
    if (s.precio.online === null) etiquetas.push(el("span", { class: "etiqueta durazno", text: "Solo presencial" }));
    var texto = el("span", { class: "eleccion-texto" }, [
      el("span", { class: "eleccion-titulo", text: s.nombre }),
      el("span", { class: "etiquetas" }, etiquetas)
    ]);
    if (s.duraciones) {
      var durs = el("span", { class: "duraciones", id: "duraciones-" + s.id, role: "radiogroup", "aria-label": "¿Cuánto tiempo necesitas?" });
      durs.hidden = true;
      s.duraciones.forEach(function (d) {
        var r = el("input", { type: "radio", name: "dur-" + s.id, value: String(d) });
        if (d === s.min) r.checked = true;
        durs.appendChild(el("label", { class: "duracion" }, [r, el("span", { text: R.fmtDuracion(d) })]));
      });
      texto.appendChild(durs);
    }
    var caja = el("span", { class: "eleccion-caja" }, [el("span", { class: "marca-eleccion", html: CHECK }), texto]);
    var label = el("label", { class: "eleccion" + (esPack ? " pack" : "") }, [input, caja]);
    var info = el("button", { type: "button", class: "boton-info", "data-info": s.id, "aria-label": "Más información sobre " + s.nombre, text: "i" });
    return el("div", { class: "eleccion-envoltorio" }, [label, info]);
  }

  var lista = $("lista-servicios");
  var grupos = {};
  var columnas = el("div", { class: "grupos-servicios" });
  lista.appendChild(columnas);
  R.SERVICIOS.forEach(function (s) {
    if (!grupos[s.grupo]) {
      grupos[s.grupo] = el("div", { class: "elecciones compactas" });
      columnas.appendChild(el("div", { class: "grupo-servicios" }, [
        el("h3", { class: "grupo", text: s.grupo === "Pre-parto" ? "Preparación al parto" : s.grupo }), grupos[s.grupo]]));
    }
    grupos[s.grupo].appendChild(tarjeta(s, false));
  });
  columnas.appendChild(el("div", { class: "grupo-servicios ancho" }, [
    el("h3", { class: "grupo", text: "Pack" }), el("div", { class: "elecciones compactas" }, [tarjeta(R.PACK, true)])]));

  // ---------- Ventana de información ----------
  var dialogo = $("info-servicio");
  var dialogoServicio = null;
  var entradaHistorial = false;
  function buscarCualquiera(id) {
    return id === "pack" ? R.PACK : R.SERVICIOS.filter(function (s) { return s.id === id; })[0];
  }
  function pintarBotonDialogo() {
    var marcado = $("srv-" + dialogoServicio.id).checked;
    $("info-elegir").textContent = marcado ? "Quitar de mi cita" : "Añadir a mi cita";
    $("info-elegir").classList.toggle("suave", marcado);
  }
  function abrirInfo(id) {
    var s = buscarCualquiera(id);
    dialogoServicio = s;
    $("info-titulo").textContent = s.nombre;
    $("info-texto").textContent = s.info || s.detalle;
    var et = $("info-etiquetas");
    et.textContent = "";
    et.appendChild(el("span", { class: "etiqueta", text: textoDuracion(s) }));
    et.appendChild(el("span", { class: "etiqueta durazno", text: s.precio.online === null ? "Solo presencial" : "Presencial u online" }));
    pintarBotonDialogo();
    if (typeof dialogo.showModal === "function") dialogo.showModal(); else dialogo.setAttribute("open", "");
    // El botón "atrás" del móvil cierra la ventana en lugar de salir de la página
    try { history.pushState({ infoAbierta: true }, ""); entradaHistorial = true; } catch (e) { entradaHistorial = false; }
  }
  function cerrarInfo() {
    if (dialogo.open) dialogo.close();
  }
  dialogo.addEventListener("close", function () {
    if (entradaHistorial) { entradaHistorial = false; history.back(); }
  });
  window.addEventListener("popstate", function () {
    if (dialogo.open) { entradaHistorial = false; dialogo.close(); }
  });
  dialogo.addEventListener("click", function (e) {
    if (e.target === dialogo) cerrarInfo(); // clic en el fondo oscuro
  });
  $("info-cerrar").addEventListener("click", cerrarInfo);
  $("info-elegir").addEventListener("click", function () {
    var c = $("srv-" + dialogoServicio.id);
    c.checked = !c.checked;
    c.dispatchEvent(new Event("change", { bubbles: true }));
    cerrarInfo();
  });
  lista.addEventListener("click", function (e) {
    var b = e.target.closest(".boton-info");
    if (b) { e.preventDefault(); abrirInfo(b.getAttribute("data-info")); }
  });

  lista.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "pack" && t.checked) {
      lista.querySelectorAll('input[name="servicio"]').forEach(function (c) { c.checked = false; });
    } else if (t.name === "servicio" && t.checked) {
      $("srv-pack").checked = false;
    } else if (t.name === "dur-seguimiento") {
      estado.durSeg = Number(t.value);
    }
    estado.ids = Array.prototype.map.call(lista.querySelectorAll('input[name="servicio"]:checked'), function (c) { return c.value; });
    estado.pack = $("srv-pack").checked;
    $("duraciones-seguimiento").hidden = estado.ids.indexOf("seguimiento") === -1;
    validarPaso1();
  });

  function validarPaso1() {
    var hay = estado.pack || estado.ids.length > 0;
    var min = minutosElegidos();
    var aviso = $("aviso-paso1");
    aviso.textContent = "";
    var ok = hay;
    if (!estado.pack && min > 240) {
      ok = false;
      aviso.textContent = "Estos servicios suman " + R.fmtDuracion(min) + " y no caben en una sola cita (máximo 4 h). Elige menos o resérvalos en dos citas.";
    }
    $("continuar-1").disabled = !ok;
  }

  // ---------- Paso 2: modalidad ----------
  function pintarModalidad() {
    var pres = R.calcular(estadoCalculo("presencial", 0));
    var onl = R.calcular(estadoCalculo("online", 0));
    $("precio-presencial").textContent = R.fmtEuros(pres.total);
    var sinOnline = soloPresencial();
    if (sinOnline && estado.modalidad === "online") estado.modalidad = null;
    $("mod-online").disabled = sinOnline;
    $("precio-online").textContent = sinOnline ? "" : R.fmtEuros(onl.total);
    $("precio-online").hidden = sinOnline;
    $("nota-online").textContent = sinOnline ? "No disponible para tu selección" : "Por videollamada, desde donde estés";
    $("mod-online").closest(".eleccion").classList.toggle("no-disponible", sinOnline);
    $("nota-presencial").textContent = "En tu casa · + desplazamiento según la zona";
    var inOnline = $("mod-online"), inPres = $("mod-presencial");
    if (estado.modalidad === "online") inOnline.checked = true;
    else if (estado.modalidad === "presencial") inPres.checked = true;
    else { inOnline.checked = false; inPres.checked = false; }
    $("continuar-2").disabled = !estado.modalidad;
  }
  $("paso-2").addEventListener("change", function (e) {
    if (e.target.name === "modalidad") {
      estado.modalidad = e.target.value;
      $("continuar-2").disabled = false;
    }
  });

  // ---------- Paso 3: código postal ----------
  var inputCp = $("cp");
  function evaluarCp() {
    var v = inputCp.value.replace(/\D/g, "").slice(0, 5);
    if (inputCp.value !== v) inputCp.value = v;
    estado.cp = v;
    estado.zona = null;
    var out = $("resultado-cp");
    out.className = "resultado-cp";
    out.textContent = "";
    var ok = false;
    var botonOnline = $("pasar-online");
    botonOnline.hidden = true;
    if (v.length === 5) {
      var z = CP[v];
      if (!z) {
        out.classList.add("mal");
        out.appendChild(el("span", { text: v.indexOf("28") === 0
          ? "No encontramos ese código postal. Revísalo o escríbenos y lo miramos."
          : "De momento solo hacemos consultas presenciales en la Comunidad de Madrid." }));
        botonOnline.hidden = soloPresencial();
      } else if (z[1] === null) {
        out.classList.add("mal");
        out.appendChild(el("span", { class: "lugar", text: z[0] }));
        out.appendChild(el("span", { text: "Lo sentimos: hasta aquí no podemos desplazarnos." + (soloPresencial() ? "" : " Puedes hacer la consulta online.") }));
        botonOnline.hidden = soloPresencial();
      } else {
        estado.zona = z;
        ok = true;
        out.appendChild(el("span", { class: "lugar", text: z[0] }));
        out.appendChild(el("span", { text: z[1] === 0 ? "Desplazamiento incluido." : "Desplazamiento: + " + R.fmtEuros(z[1]) }));
      }
    }
    $("continuar-3").disabled = !ok;
  }
  inputCp.addEventListener("input", evaluarCp);
  $("pasar-online").addEventListener("click", function () {
    estado.modalidad = "online";
    irA(4);
  });

  // ---------- Paso 4: nota ----------
  var nota = $("nota");
  nota.addEventListener("input", function () {
    estado.nota = nota.value;
    $("contador-nota").textContent = nota.value.length + " / " + nota.maxLength;
  });

  // ---------- Paso 5: resumen y calendario ----------
  function pintarResumen() {
    var modalidad = soloPresencial() ? "presencial" : estado.modalidad;
    var res = R.calcular(estadoCalculo(modalidad, modalidad === "presencial" ? (estado.zona ? estado.zona[1] : undefined) : 0));
    var caja = $("resumen");
    caja.textContent = "";
    var tabla = el("table", { class: "resumen-tabla" });
    res.lineas.forEach(function (l) {
      tabla.appendChild(el("tr", {}, [el("td", { text: l.nombre + " · " + R.fmtDuracion(l.minutos) }), el("td", { class: "der", text: R.fmtEuros(l.precio) })]));
    });
    tabla.appendChild(el("tr", {}, [el("td", { text: modalidad === "presencial" ? "Presencial en " + (estado.zona ? estado.zona[0] : "tu casa") : "Online, por videollamada" }),
      el("td", { class: "der", text: res.suplemento > 0 ? "+ " + R.fmtEuros(res.suplemento) : "" })]));
    if (res.descuento > 0) tabla.appendChild(el("tr", {}, [el("td", { text: "Descuento por juntar servicios en una visita" }), el("td", { class: "der", text: "− " + R.fmtEuros(res.descuento) })]));
    tabla.appendChild(el("tr", { class: "total" }, [el("td", { text: "Total · " + R.fmtDuracion(res.minutos) }), el("td", { class: "der", text: R.fmtEuros(res.total) })]));
    caja.appendChild(tabla);
    if (res.sugerenciaPack && res.sugerenciaPack.ahorro > 0) caja.appendChild(el("p", { class: "nota", text: "Consejo: el pack de preparación a la maternidad incluye estos tres servicios y te sale " + R.fmtEuros(res.sugerenciaPack.ahorro) + " más barato." }));
    caja.appendChild(el("p", { class: "nota", text: "Pago en efectivo o Bizum." + (res.solo_manana ? " Por su duración, solo hay huecos por la mañana." : "") }));
    res.errores.forEach(function (m) { caja.appendChild(el("p", { class: "error", text: m })); });

    var extra = { cp: modalidad === "presencial" ? estado.cp : "", nota: estado.nota.trim() };
    var cal = $("bloque-calendario"), sin = $("sin-calendario");
    if (res.ok && R.calConfigurado(cfg)) {
      var url = R.urlReserva(res, cfg, extra);
      $("banner-duracion").innerHTML = "";
      $("banner-duracion").appendChild(el("strong", { text: "Tu cita dura " + R.fmtDuracion(res.minutos) + ". " }));
      $("banner-duracion").appendChild(document.createTextNode(res.pack ? "Elige día y hora de inicio." : "Comprueba que el calendario muestra esa duración y elige día y hora."));
      $("marco-calendario").src = url;
      $("abrir-calendario").href = url;
      cal.hidden = false; sin.hidden = true;
    } else {
      cal.hidden = true; sin.hidden = !res.ok;
      var texto = "Hola María, me gustaría reservar una cita.\n" + R.notasReserva(res, extra);
      $("pedir-whatsapp").href = "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent(texto);
      $("pedir-email").href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent("Reserva de cita") + "&body=" + encodeURIComponent(texto);
    }
  }

  // ---------- Navegación ----------
  function irA(n, inicial) {
    pasoActual = n;
    var visibles = pasosVisibles();
    [1, 2, 3, 4, 5].forEach(function (i) { $("paso-" + i).hidden = i !== n; });
    raiz.querySelectorAll(".pasos-progreso li").forEach(function (li) {
      var i = Number(li.getAttribute("data-paso"));
      li.hidden = visibles.indexOf(i) === -1;
      li.classList.toggle("actual", i === n);
      li.classList.toggle("hecho", i < n && visibles.indexOf(i) !== -1);
      if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    raiz.querySelectorAll(".pasos-progreso li").forEach(function (li) {
      li.querySelector(".bola").innerHTML = li.classList.contains("hecho") ? CHECK : "";
    });
    if (n === 2) pintarModalidad();
    if (n === 3) evaluarCp();
    if (n === 5) pintarResumen();
    if (inicial) return;
    var titulo = $("paso-" + n).querySelector("h2");
    if (titulo) { titulo.setAttribute("tabindex", "-1"); titulo.focus({ preventScroll: true }); }
    raiz.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function siguiente() {
    var v = pasosVisibles();
    return v[v.indexOf(pasoActual) + 1];
  }
  function anterior() {
    var v = pasosVisibles();
    return v[v.indexOf(pasoActual) - 1];
  }
  raiz.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ir]");
    if (!b || b.disabled) return;
    e.preventDefault();
    if (b.getAttribute("data-ir") === "siguiente") {
      irA(siguiente());
    } else {
      irA(anterior());
    }
  });
  raiz.addEventListener("submit", function (e) { e.preventDefault(); });
  inputCp.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !$("continuar-3").disabled) irA(siguiente());
  });

  // Enlaces que dependen de config.js
  var urgente = $("whatsapp-urgente");
  if (urgente) urgente.href = "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent("Hola María, necesito una cita urgente (en menos de 24 h).");
  var destete = $("enlace-destete");
  if (destete) destete.href = R.calConfigurado(cfg)
    ? "https://cal.com/" + cfg.calUsuario + "/seguimiento-destete"
    : "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent("Hola María, quiero reservar un seguimiento del plan de destete.");

  validarPaso1();
  irA(1, true);
})();
