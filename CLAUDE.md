# Cuentas Claras — contexto para sesiones de Claude

Proyecto social pro bono de educación financiera para Ecuador/Latam, de Carla.
Publicado en: https://carla-scribano.github.io/cuentas-claras/ (GitHub Pages, repo carla-scribano/cuentas-claras).

## Arquitectura

- `index.html` — TODA la página en un solo archivo, sin frameworks ni build. Decisión deliberada: público con Android de gama baja y datos limitados. No introducir dependencias ni separar archivos sin hablarlo con Carla.
- `worker/worker.js` — Cloudflare Worker del chat (fuente de verdad; desplegado en `https://cuentas-claras-chat.carla-844.workers.dev`). Guarda los prompts de los dos personajes del chat y la clave de Anthropic como secreto `ANTHROPIC_API_KEY`.
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

## Datos de los usuarios

Todo vive en localStorage del teléfono del usuario (deudas, presupuesto). Sin backend, sin registro, sin analytics. El chat no guarda conversaciones.

## Validaciones que se hacen antes de publicar

- Probar los flujos en el navegador (preview `cuentas-claras` en .claude/launch.json, puerto 8642) y limpiar localStorage de prueba.
- Los colores de gráficos se validan para daltonismo (skill dataviz, script validate_palette). Paleta del pastel: lila #a78bfa (diezmo), índigo #4f46e5 (vida), rojo vino #be123c (deudas), teal #0d9488 (ahorro), ámbar #d97706 (gustos).

## Pendientes conocidos

- Enlace de donaciones: la tarjeta "¿Te sirvió?" en Inicio tiene `ENLACES_DONACION = []` en index.html esperando un PayPal.Me o enlace deUna de Carla.
- Ideas futuras en README.md (PWA offline, audio para WhatsApp, kichwa, dominio propio, validar tasas BCE).
