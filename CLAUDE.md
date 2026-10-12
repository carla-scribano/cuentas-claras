# Libre de Deudas — contexto para sesiones de Claude

Proyecto social pro bono de educación financiera para Ecuador/Latam, de Carla.
Publicado en: https://librededeudas.beritfundacion.org/ (GitHub Pages con dominio propio, repo carla-scribano/cuentas-claras). Es la dirección definitiva: no volver a cambiarla, porque los datos de los usuarios en localStorage dependen de ella.
- Dominio: `beritfundacion.org` es de la Fundación Berit de Carla; su DNS se administra en Squarespace (allí está el registro CNAME `librededeudas` → `carla-scribano.github.io`). La raíz `beritfundacion.org` es una página de Squarespace aparte; no tocarla.
- La dirección vieja `carla-scribano.github.io/cuentas-claras/` redirige sola a la nueva. El worker acepta ambas en `ORIGENES_PERMITIDOS`.
- Si algún día se cambia de hosting (p. ej. Netlify), basta con cambiar el destino del CNAME en Squarespace; la dirección no cambia.
Renombrado de "Cuentas Claras" a "Libre de Deudas" en octubre 2026 (ya existía una app Android con el nombre anterior). El repo y las claves de localStorage conservan el nombre viejo a propósito.

## Arquitectura

- `index.html` — TODA la página en un solo archivo, sin frameworks ni build. Decisión deliberada: público con Android de gama baja y datos limitados. No introducir dependencias ni separar archivos sin hablarlo con Carla.
- `worker/worker.js` — Cloudflare Worker (fuente de verdad; desplegado en `https://cuentas-claras-chat.carla-844.workers.dev`). Tres rutas: `POST /` es el chat (prompts de los dos personajes; secreto `ANTHROPIC_API_KEY`), `POST /presupuesto` arma el reparto del presupuesto con IA (devuelve JSON con porcentajes + explicación; mismo modelo y clave) y `POST /fondo` recibe la solicitud del Fondo Solidario y la reenvía por email vía Resend. El fondo necesita dos secretos (`npx wrangler secret put ...`): `RESEND_API_KEY` (cuenta gratuita de resend.com de Carla) y `FONDO_EMAIL_DESTINO` (correo donde recibe solicitudes); Ambos están configurados (octubre 2026) y el envío está probado; sin ellos la ruta respondería un mensaje amable de "aún no disponible". Nada de la solicitud se guarda: solo viaja al email.
- PWA: `manifest.json`, `sw.js` (red primero, caché de respaldo) e `icon-192/512.png` (sol del manual de marca sobre salvia). Rutas relativas por el subdirectorio de GitHub Pages. Si cambia `index.html` no hay que tocar nada del service worker.
- Modelo del chat: `claude-haiku-4-5` (prioridad: costo mínimo, pedido explícito de Carla).

## Cómo desplegar

- **Página**: commit + push a `main` → GitHub Pages publica solo (~1 min). Verificar con curl que el cambio llegó.
- **Worker**: `cd worker && npx wrangler deploy` (wrangler ya está autorizado vía OAuth en esta máquina). Los secretos sobreviven los deploys. NO usar el editor web de Cloudflare: autocompleta brackets y daña el código.

## Reglas de contenido (importantes)

- **Nunca mencionar** a la ex-empleadora de Carla (fintech de celulares a crédito con bloqueo). El modelo se describe genéricamente: "celulares que se bloquean si no pagas".
- Tono acogedor y sin juicio, pero **sin nombrarlo**: Carla quitó "sin juzgarte" de todos los textos visibles porque "nombrar el juicio lo invoca". La frase "deber plata no te hace mala persona" sí se usa.
- Español sencillo de Ecuador, cero jerga. Moneda: **dólares, jamás pesos**.
- No recomendar marcas, bancos ni empresas específicas.
- Protocolo de crisis en todo contenido sensible: línea 171 opción 6 (apoyo emocional MSP) y 911.
- Diezmos y ofrendas: existe como categoría **opcional** del presupuesto (Carla es creyente); ahí sí lenguaje de fe explícito porque es opt-in. El chat de Clarita aplica principios bíblicos de finanzas pero en lenguaje secular.
- La página del Fondo Solidario usa tono "fe honesta, sin presión" (decidido por Carla): nombra la fe como origen del fondo, pero deja claro que la ayuda no tiene condiciones religiosas.
- La regla de no nombrar el juicio también vive en el prompt del worker (prohibido "juzgar"/"juicio" en las respuestas del chat).

## Datos de los usuarios

Todo vive en localStorage del teléfono del usuario (deudas, presupuesto). Sin backend, sin registro, sin analytics. El chat no guarda conversaciones.

## Validaciones que se hacen antes de publicar

- Probar los flujos en el navegador (preview `cuentas-claras` en .claude/launch.json, puerto 8642) y limpiar localStorage de prueba.
- Los colores de gráficos se validan para daltonismo (skill dataviz, script validate_palette). Paleta del pastel: lila #a78bfa (diezmo), índigo #4f46e5 (vida), rojo vino #be123c (deudas), teal #0d9488 (ahorro), ámbar #d97706 (gustos).

## Marca (manual de marca de Fundación Berit, octubre 2026)

El manual vive fuera del repo, en la carpeta privada de Carla `~/GitHub/Fundacion Berit/Brandbook/` (no subirlo al repo: es público y se publica en la web). La app ya lo aplica:
- Paleta (variables en `:root` de index.html): pino #3E5F3A (textos destacados, botones, logo), crema #FCF8F1 (fondo), tinta #2A2622 (texto), salvia #DFE8D6, miel #F7D98B (destacados), terracota #F2CDB8 (mensajes personales y nota de apoyo), arena #F3E6D3, barro #9A4A2C (acento), sol #E8B547 (solo el sol, nunca texto). Texto suave #5a544c. Las variables viejas (`--verde`, `--verde-claro`…) apuntan a las nuevas.
- Semáforo: peligro #B42318/#FBE4E1, cuidado #8A5A00/#FBEFC9, bien #276B43/#DCEFE2. El color nunca va solo: cada aviso lleva una forma en CSS (rombo, triángulo, círculo) además de la palabra; por eso los títulos de `.veredicto` no llevan emoji al inicio.
- Tipografía: solo fuente del sistema. Títulos sin negrita (h2 24/30 regular, h3 20/26 medium), texto 16/24, mínimo 14 px (excepción: etiquetas de la barra inferior, 12 px, por las 7 pestañas), botones 48 px de alto en medium.
- Logo de la cabecera e íconos de la app: sol con 5 rayos sobre el horizonte, en salvia/sol/pino. El logo está dibujado como SVG dentro de index.html; los PNG de los íconos se generan del mismo dibujo.
- No usar fuentes externas (Source Serif/Sans son solo para redes e impresos).

## Hoja de ruta acordada (sesión de planeación, octubre 2026)

Plan completo en `~/.claude/plans/okay-te-puse-en-delegated-stream.md`. Orden: (1) renombre a Libre de Deudas, (2) PWA instalable/offline (Carla autorizó los archivos de soporte manifest/sw/ícono — index.html sigue siendo uno solo), (3) respaldo sin cuenta (exportar/importar las dos claves de localStorage; se decidió NO hacer cuentas con backend), (4) Fondo solidario: página con tono "fe honesta, sin presión" + formulario que el worker reenvía al email de Carla (los textos los aprueba Carla antes de publicar; lo legal lo maneja ella).

## Pendientes conocidos

- Enlace de donaciones: la tarjeta "¿Te sirvió?" en Inicio tiene `ENLACES_DONACION = []` en index.html esperando un PayPal.Me o enlace deUna de Carla (pospuesto hasta que lo cree).
- Hecho: dominio propio (librededeudas.beritfundacion.org, octubre 2026). Siguiente: difusión (PWA y fondo ya están en vivo).
- Ideas futuras en README.md (audio para WhatsApp, kichwa, validar tasas BCE).
