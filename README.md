# Maqueta web · consultas de lactancia

Web estática (HTML y CSS, sin instalar nada) para probar el diseño y publicarla gratis en GitHub Pages.

## Qué incluye

- `index.html`: inicio
- `servicios.html`: servicios, tarifas y preguntas frecuentes
- `reservar.html`: reserva de citas (Cal.com incrustado)
- `sobre-mi.html`: presentación
- `blog.html` y `articulo-primeras-semanas.html`: blog y un artículo de ejemplo
- `aviso-legal.html`: borrador de aviso legal, privacidad y cookies
- `styles.css`: todos los colores y estilos

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
| `NOMBRE APELLIDO` y `NOMBRE` | Nombre real |
| `EMAIL`, `TELEFONO`, `DIRECCION, CIUDAD` | Datos de contacto |
| `NUMERO` | Número de colegiada |
| `NIF`, `COLEGIO` | Datos del aviso legal |
| `TU-USUARIO` | Tu usuario de Cal.com (en `reservar.html`) |
| `XX €` | Precios reales |

También hay que reemplazar los textos de ejemplo y añadir fotos.

## Citas con Cal.com

1. Crea una cuenta gratuita en cal.com.
2. En Ajustes > Calendarios, conecta Apple Calendar con una contraseña específica de aplicación (se genera en appleid.apple.com).
3. Crea tus tipos de cita (presencial, online, seguimiento) y conecta Stripe para los cobros.
4. En `reservar.html`, cambia `TU-USUARIO` por tu usuario.

## Cambiar los colores

En lo alto de `styles.css` están las variables (`--terracota`, `--crema`, `--tinta`...). Cambia ahí los colores y se actualiza toda la web.

## Importante antes de publicar

Los textos legales son un borrador. Hazlos revisar por una gestoría o un profesional: se tratan datos de salud.
