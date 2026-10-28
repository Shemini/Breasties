# Breasties · The best of the breast

Web de las consultas de lactancia de María Izquierdo, matrona.

Web estática (HTML y CSS, sin instalar nada) para probar el diseño y publicarla gratis en GitHub Pages.

## Qué incluye

- `index.html`: inicio
- `servicios.html`: servicios, tarifas y preguntas frecuentes
- `reservar.html`: calculadora de precio y reserva de citas (Cal.com incrustado)
- `contacto.html`: WhatsApp y correo
- `config.js`: usuario de Cal.com, WhatsApp y correo
- `reservas.js`: servicios, precios y la reserva paso a paso
- `cp.js`: código postal → zona y suplemento (para cambiar un suplemento, edita su número)
- `zonas.js`: tiempos en coche desde Guzmán el Bueno usados para calcular `cp.js`
- `sobre-mi.html`: presentación
- `blog.html` y `articulo-primeras-semanas.html`: blog y un artículo de ejemplo
- `aviso-legal.html`: borrador de aviso legal, privacidad y cookies
- `styles.css`: todos los colores y estilos (estilo acuarela: rosa empolvado, crema, melocotón y salvia)

Las páginas usan las tipografías DM Serif Display, Nunito y Caveat de Google Fonts (necesitan conexión; sin ella se ven con tipos del sistema).

## Probarla en tu ordenador

Abre `index.html` con doble clic. Funciona sin servidor.

## Publicarla en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `web-lactancia`), público.
2. Sube todos estos archivos a la raíz del repositorio (botón "Add file" > "Upload files").
3. Ve a **Settings > Pages**. En "Build and deployment", elige "Deploy from a branch", rama `main` y carpeta `/ (root)`. Guarda.
4. En un par de minutos la web estará en `https://TU-USUARIO.github.io/web-lactancia/`.

### Con dominio propio

1. En **Settings > Pages > Custom domain**, escribe tu dominio y guarda.
2. En el panel de tu registrador de dominios, crea los registros DNS que indica la documentación de GitHub Pages ("Managing a custom domain for your GitHub Pages site"), porque pueden cambiar.
3. Cuando el dominio se verifique, marca "Enforce HTTPS".

## Cosas que hay que sustituir

Busca estas palabras en todos los archivos (en un editor de texto, con "Buscar en archivos") y cámbialas por los datos reales:

| Marcador | Qué poner |
|---|---|
| `EMAIL`, `TELEFONO`, `DIRECCION, CIUDAD` | Datos de contacto |
| `NUMERO` | Número de colegiada |
| `NIF`, `COLEGIO` | Datos del aviso legal |
| `TU-USUARIO` | Tu usuario de Cal.com (en `config.js` y en el enlace de seguimiento de destete en `reservar.html`) |
| `34600000000`, `EMAIL` | WhatsApp y correo (en `config.js`) |

También hay que reemplazar los textos de ejemplo y añadir fotos: en los marcos de foto (clase `foto`) borra el texto y pon `<img src="tu-foto.jpg" alt="descripción">`; la imagen se recorta sola a la forma del marco.

## Citas con Cal.com (Google Calendar)

Pago en efectivo o Bizum; las facturas las gestionáis vosotros. Sin Stripe por ahora.

1. Crea una cuenta gratuita en cal.com y conecta **Google Calendar** (Ajustes > Calendarios).
2. Crea dos horarios: **Consultas** (10:00-14:00 y 16:00-18:00, lunes a viernes, ajusta los días) y **Pack** (10:00-14:30 y 16:00-18:00).
3. Crea estos tipos de evento (el nombre corto del enlace debe ser exactamente este):

| Enlace | Horario | Duraciones | Margen antes/después |
|---|---|---|---|
| `cita-online` | Consultas | 15 a 240 min, de 15 en 15 | 60 min |
| `cita-presencial` | Consultas | 15 a 240 min, de 15 en 15 | 60 min |
| `cita-presencial-lejos` | Consultas | 15 a 240 min, de 15 en 15 | 90 min |
| `pack-preparacion` | Pack | 270 min fijos | 60 min |
| `pack-preparacion-lejos` | Pack | 270 min fijos | 90 min |
| `seguimiento-destete` | Consultas | 15 min | 60 min |

4. En todos: reservas hasta 30 días vista, aviso mínimo de 24 h, intervalo de huecos de 15 min. Ubicación: Google Meet en los online; "dirección del asistente" en los presenciales. Añade un campo de dirección y teléfono. En el texto de confirmación indica pago en efectivo o Bizum.
5. Pon tu usuario en `config.js`. Mientras siga `TU-USUARIO`, el último paso de la reserva ofrece pedir cita por WhatsApp o correo con el resumen (así no sale la página 404 de Cal.com).

Las reservas urgentes (menos de 24 h, +20 €) se piden por WhatsApp.

### Cosas por comprobar en tu cuenta de Cal.com

- Que el enlace con `?duration=` preseleccione la duración.
- Que acepte márgenes de 60 y 90 min y huecos de 15 min en el plan gratuito.
- Cómo se comportan los márgenes entre citas de distinto tipo (presencial normal y lejos).
- Que el calendario se vea incrustado; si no, el botón "Ábrelo en otra pestaña" sirve igual.

## Cambiar los colores

En lo alto de `styles.css` están las variables (`--acento`, `--rosa`, `--crema`, `--tinta`...). Cambia ahí los colores y se actualiza toda la web.

## Importante antes de publicar

Los textos legales son un borrador. Hazlos revisar por una gestoría o un profesional: se tratan datos de salud.
