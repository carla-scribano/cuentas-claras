# 💡 Cuentas Claras

Herramientas gratuitas de educación financiera para Ecuador y Latinoamérica. Proyecto social, sin fines de lucro.

## El problema

En Ecuador y gran parte de Latinoamérica, el analfabetismo financiero lleva a la gente a:

- Comprar a cuotas sin darse cuenta de que terminan pagando 2 o 3 veces el precio del producto (la "cuota chiquita" engaña).
- Caer en la trampa del pago mínimo de las tarjetas de crédito.
- Recurrir al chulco (prestamistas informales/extorsionadores) cuando ya están desesperados.
- Sufrir consecuencias graves: depresión, familias rotas, e incluso suicidios.

La meta de este proyecto es que la gente **decida con información antes de endeudarse**, y que quien ya está endeudado tenga **un plan claro para salir**.

## Qué incluye (v1)

Una sola página web (`index.html`), en español sencillo, pensada para celulares Android de gama baja:

| Herramienta | Qué hace |
|---|---|
| 🛒 Calculadora de cuotas | Muestra el costo total real de una compra a cuotas (semanal/quincenal/mensual), el sobreprecio, y la tasa de interés anual implícita, con semáforo (verde/amarillo/rojo). |
| 💳 Simulador de tarjeta | Muestra en cuántos meses se sale de una deuda de tarjeta pagando X al mes, cuánto se va en intereses, y el efecto de pagar $20 más. Detecta cuando el pago no cubre ni los intereses. |
| 🧗 Plan bola de nieve | El usuario anota sus deudas y arma un plan de pago ordenado. Los datos se guardan solo en su teléfono (localStorage). |
| 📚 Sección "Aprende" | Deuda buena vs. mala, cómo funcionan las tarjetas, celulares con bloqueo como garantía, el chulco, señales de alerta, derechos del deudor en Ecuador. |
| 💬 Chat: Clarita y el Doctor Justo | Dos personajes: asesora financiera y orientador legal, en lenguaje ultra sencillo. Incluye preguntas frecuentes con respuestas pre-escritas (gratis, sin IA) y chat libre con IA (requiere desplegar el worker, ver abajo). Con descargos de responsabilidad y protocolo de crisis emocional. |

## Decisiones de diseño

- **Un solo archivo HTML, cero dependencias.** Carga rápido con datos móviles limitados, funciona offline una vez cargado, y hasta se puede compartir el archivo por WhatsApp.
- **Sin registro, sin datos personales, sin backend.** Todo se calcula y guarda en el dispositivo. Genera confianza y elimina costos de infraestructura.
- **Tono sin juicio.** Nunca culpar al usuario ("deber plata no te hace mala persona"). Incluye nota de apoyo emocional con líneas de ayuda de Ecuador.
- **Sin marcas.** No se menciona ninguna empresa específica; se describe el modelo de negocio (ej: "celulares que se bloquean si no pagas") de forma genérica.

## Cómo probarlo

Abre `index.html` en cualquier navegador, o sirve la carpeta:

```bash
python3 -m http.server 8080
```

## Cómo publicarlo gratis

1. Crear un repositorio en GitHub y subir estos archivos.
2. Activar **GitHub Pages** (Settings → Pages → deploy from branch `main`).
3. Opcional: comprar un dominio corto y fácil de dictar (ej: `cuentasclaras.ec`) — es el único costo del proyecto.

## Cómo activar el chat con IA (una sola vez, ~15 minutos)

El chat libre usa **Claude Haiku 4.5** (el modelo más económico de Anthropic, ~$0.002–0.005 por mensaje) a través de un **Cloudflare Worker** gratuito que guarda la clave de la API. Las preguntas frecuentes funcionan siempre, sin costo y sin este paso.

1. **Clave de la API de Anthropic**: crea una cuenta en [console.anthropic.com](https://console.anthropic.com), agrega un método de pago y genera una API key. **Importante:** en Settings → Limits pon un límite de gasto mensual (ej: $5) para dormir tranquila.
2. **Cloudflare Worker**: crea una cuenta gratis en [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create Worker. Borra el código de ejemplo y pega el contenido de [`worker/worker.js`](worker/worker.js). Deploy.
3. **Guarda la clave como secreto**: en el Worker → Settings → Variables and Secrets → Add → tipo "Secret", nombre `ANTHROPIC_API_KEY`, valor tu clave. Deploy de nuevo.
4. **Conecta la página**: copia la URL del worker (algo como `https://cuentas-claras-chat.TUUSUARIO.workers.dev`) y pégala en `index.html`, en la constante `CHAT_API_URL`. Commit y push.

Notas de seguridad y costos:
- La clave de la API vive solo en Cloudflare, nunca en el navegador.
- El worker solo acepta peticiones desde el dominio de la página (lista `ORIGENES_PERMITIDOS` en `worker.js` — agrega ahí tu dominio si compras uno).
- Límites anti-abuso: máximo 16 mensajes por conversación, 1.000 caracteres por mensaje, respuestas de máximo ~600 tokens.
- La red de seguridad definitiva es el límite de gasto del paso 1: aunque alguien abuse, el gasto se detiene ahí.
- Los prompts de los personajes (personalidad, reglas de seguridad, protocolo de crisis) viven en el worker, no en la página, para que nadie pueda alterarlos.

## Ideas para versiones futuras

- [ ] Convertirlo en PWA instalable (manifest + service worker) para uso 100% offline.
- [ ] Comparador: "¿cuánto me costaría esto en una cooperativa vs. esta financiera?"
- [ ] Contenido en formato de audio/video corto para gente con poca alfabetización lectora (distribución por WhatsApp/TikTok).
- [ ] Calculadora de presupuesto básico ("separa primero, gasta después").
- [ ] Actualizar tasas máximas legales del BCE por segmento, con fuente y fecha.
- [ ] Versión en kichwa.
