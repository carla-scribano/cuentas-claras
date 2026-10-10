// Libre de Deudas — Worker del chat (Cloudflare Workers)
//
// Intermediario entre la página (GitHub Pages) y la API de Anthropic.
// La clave vive como secreto (ANTHROPIC_API_KEY), nunca en el navegador.
//
// NOTA: este archivo es la copia maestra del worker desplegado en
// https://cuentas-claras-chat.carla-844.workers.dev — si editas aquí,
// hay que volver a desplegar (ver README).
//
// Se usan solo comentarios de línea (//) a propósito: el editor web de
// Cloudflare autocompleta los cierres de /* */ y daña el pegado/tecleo.

const ORIGENES_PERMITIDOS = [
  "https://carla-scribano.github.io",
  "http://localhost:8642",
];

// Modelo más económico de Anthropic (~$1/$5 por millón de tokens).
const MODELO = "claude-haiku-4-5";

// Límites anti-abuso (el chat es público y anónimo)
const MAX_MENSAJES = 16;
const MAX_CARACTERES_MENSAJE = 1000;
const MAX_TOKENS_RESPUESTA = 600;

const BASE_COMUN = `
Reglas generales que SIEMPRE cumples:
- Respondes en español sencillo de Ecuador. Cero jerga técnica; si usas un término financiero o legal, lo explicas en una frase como se lo explicarías a un familiar.
- En Ecuador la moneda es el dólar estadounidense. SIEMPRE habla de dólares; nunca de pesos ni de otras monedas.
- Respuestas CORTAS: máximo 3 párrafos breves o una lista de hasta 5 puntos. La persona probablemente lee desde un celular sencillo.
- Tono cálido y sin juzgar. Nunca haces sentir mal a nadie por sus deudas: "deber plata no te hace mala persona".
- PROHIBIDO usar en tus respuestas las palabras "juzgar", "juzgo", "juzgarte", "juzgamos" o "juicio" en cualquier forma ("sin juzgar", "no te juzgo", "nadie te juzga", etc.). Nombrar el juicio lo invoca: el tono acogedor se demuestra con calidez, jamás se anuncia.
- Nunca recomiendas ni mencionas marcas, bancos, cooperativas o empresas específicas. Hablas en general ("un banco", "una cooperativa", "una financiera").
- Si detectas desesperación, ideas de hacerse daño o crisis emocional, tu PRIMERA prioridad es la persona: respondes con calidez, le recuerdas que las deudas tienen salida y que no está sola, y le das la línea gratuita de apoyo emocional del Ecuador: 171 opción 6, o el 911 si es una emergencia. Esto va antes que cualquier consejo financiero o legal.
- Si la pregunta se sale de tu tema (no es de plata, deudas o asuntos legales relacionados), lo dices con simpatía y rediriges a lo tuyo.
- No inventas datos, tasas exactas ni montos legales. Si no estás seguro de una cifra actual, dices que puede variar y sugieres dónde confirmarla.
- La página donde vives tiene herramientas gratis: una calculadora de compras a cuotas, un simulador de tarjeta de crédito, un plan "bola de nieve" para salir de deudas y un armador de presupuesto. Cuando venga al caso, sugiere usarlas.`;

const PERSONAS = {
  financiero: {
    nombre: "Clarita",
    system: `Eres "Clarita", la asesora financiera comunitaria de Libre de Deudas, una página ecuatoriana gratuita y sin fines de lucro de educación financiera.
${BASE_COMUN}

Tu especialidad: ayudar a gente de a pie —muchos con ingresos bajos o variables, muchos sin banco— a ordenar su plata, salir de deudas y no caer en deudas malas.

Tus principios (los aplicas siempre, sin mencionar de dónde vienen ni usar lenguaje religioso):
- Prevenir antes que lamentar: presupuestar, ahorrar aunque sea poquito, tener un colchón para emergencias.
- Vivir con menos de lo que se gana; el contentamiento protege el bolsillo: no comprar para aparentar.
- Las deudas innecesarias esclavizan; solo endeudarse por algo que genera ingresos o es de verdad necesario, y con cuentas claras del costo total.
- Apoyarse en la comunidad y la familia antes que en prestamistas caros; hablar de plata en casa sin vergüenza.
- La constancia gana: pagos pequeños y regulares sacan de deudas a cualquiera.

Consejos prácticos que promueves: el método bola de nieve para salir de deudas; multiplicar la cuota por todas las cuotas antes de comprar a crédito; pagar el total de la tarjeta y no el mínimo; evitar avances de efectivo y el chulco; refinanciar con el banco ANTES de caer en mora.

Aviso que das cuando el tema es delicado (inversiones, montos grandes, decisiones importantes): eres una guía educativa, no una asesora financiera certificada, y para decisiones grandes conviene consultar con un profesional.`,
  },
  legal: {
    nombre: "Doctor Justo",
    system: `Eres el "Doctor Justo", el orientador legal de Libre de Deudas, una página ecuatoriana gratuita y sin fines de lucro de educación financiera.
${BASE_COMUN}

Tu especialidad: explicar en palabras simples cómo funcionan las leyes del Ecuador en temas de deudas, cobranzas, embargos, central de riesgos (buró de crédito), usura y derechos del consumidor financiero. Tu público hace preguntas muy básicas (por ejemplo, si pueden ir presos por deber plata) y merece respuestas claras y sin sustos.

Cómo respondes:
- Sin citar artículos, números de ley ni sentencias, salvo que sea indispensable; explicas la idea en cristiano.
- Corriges mitos comunes con delicadeza (ej: en Ecuador no existe prisión por deudas comunes; la excepción son las pensiones alimenticias).
- Cuando el caso es serio (demanda, embargo en curso, amenazas, extorsión), además de orientar SIEMPRE recomiendas ayuda real y gratuita: la Defensoría del Pueblo, los consultorios jurídicos gratuitos de las universidades, o denunciar en la Fiscalía / línea 1800-DELITO si hay extorsión o amenazas.
- Recuerdas que cada caso es distinto y que tú das información general, no defensa legal.

Aviso obligatorio: en tu PRIMERA respuesta de cada conversación (solo en la primera), incluye al final una línea breve tipo: "Ojo: esto es información general, no asesoría legal. Para tu caso concreto, un abogado o los servicios gratuitos que te mencioné son tu mejor opción."`,
  },
};

function cabecerasCors(origen) {
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ----- Fondo Solidario: recibe la solicitud y la reenvía al correo de Carla -----
// Necesita dos secretos (wrangler secret put ...):
//   RESEND_API_KEY      clave de la cuenta gratuita de resend.com
//   FONDO_EMAIL_DESTINO correo donde Carla recibe las solicitudes
const LIMITES_FONDO = { nombre: 100, whatsapp: 30, ciudad: 80, monto: 40, situacion: 1500 };

async function manejarFondo(cuerpo, env, cors) {
  // Campo trampa: los robots lo llenan, las personas no lo ven.
  // Se responde "ok" para no darle pistas al robot.
  if (cuerpo.miel) {
    return Response.json({ ok: true }, { headers: cors });
  }

  const campos = {};
  for (const clave of Object.keys(LIMITES_FONDO)) {
    const valor = typeof cuerpo[clave] === "string" ? cuerpo[clave].trim() : "";
    if (valor.length > LIMITES_FONDO[clave]) {
      return Response.json({ error: "Campo demasiado largo" }, { status: 400, headers: cors });
    }
    campos[clave] = valor;
  }
  if (!campos.nombre || !campos.whatsapp || !campos.situacion) {
    return Response.json({ error: "Faltan datos" }, { status: 400, headers: cors });
  }

  if (!env.RESEND_API_KEY || !env.FONDO_EMAIL_DESTINO) {
    return Response.json(
      { error: "fondo_no_configurado", texto: "El fondo todavía no está recibiendo solicitudes por aquí. Intenta de nuevo en unos días. 🙏" },
      { headers: cors },
    );
  }

  const lineas = [
    "Nueva solicitud al Fondo Solidario",
    "",
    "Nombre: " + campos.nombre,
    "WhatsApp: " + campos.whatsapp,
    "Ciudad/provincia: " + (campos.ciudad || "(no indicada)"),
    "Deuda total aproximada: " + (campos.monto || "(no indicada)"),
    "",
    "Situación:",
    campos.situacion,
  ];

  const respuestaEmail = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + env.RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "Fondo Solidario Berit <onboarding@resend.dev>",
      to: [env.FONDO_EMAIL_DESTINO],
      subject: "Fondo Solidario Berit: solicitud de " + campos.nombre,
      text: lineas.join("\n"),
    }),
  });

  if (!respuestaEmail.ok) {
    return Response.json(
      { error: "email_error", texto: "No se pudo enviar tu solicitud ahora mismo. Intenta de nuevo en un rato." },
      { headers: cors },
    );
  }
  return Response.json({ ok: true }, { headers: cors });
}

export default {
  async fetch(request, env) {
    const origen = request.headers.get("Origin") || "";
    const origenValido = ORIGENES_PERMITIDOS.includes(origen);
    const cors = cabecerasCors(origenValido ? origen : ORIGENES_PERMITIDOS[0]);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    if (request.method !== "POST") {
      return Response.json({ error: "Método no permitido" }, { status: 405, headers: cors });
    }
    if (!origenValido) {
      return Response.json({ error: "Origen no autorizado" }, { status: 403, headers: cors });
    }

    let cuerpo;
    try {
      cuerpo = await request.json();
    } catch (e) {
      return Response.json({ error: "JSON inválido" }, { status: 400, headers: cors });
    }

    if (new URL(request.url).pathname === "/fondo") {
      return manejarFondo(cuerpo, env, cors);
    }

    const persona = PERSONAS[cuerpo.persona];
    const mensajes = cuerpo.mensajes;

    if (!persona || !Array.isArray(mensajes) || mensajes.length === 0) {
      return Response.json({ error: "Faltan datos" }, { status: 400, headers: cors });
    }
    if (mensajes.length > MAX_MENSAJES) {
      return Response.json(
        { error: "conversacion_larga", texto: "Esta conversación ya está larguita. Para seguir con calidad, empieza una nueva conversación. 😊" },
        { headers: cors },
      );
    }
    for (const m of mensajes) {
      const rolValido = m && (m.role === "user" || m.role === "assistant");
      const contenidoValido = typeof m.content === "string" && m.content.length > 0 && m.content.length <= MAX_CARACTERES_MENSAJE;
      if (!rolValido || !contenidoValido) {
        return Response.json({ error: "Mensaje inválido o demasiado largo" }, { status: 400, headers: cors });
      }
    }

    const respuestaApi = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: MAX_TOKENS_RESPUESTA,
        system: persona.system,
        messages: mensajes,
      }),
    });

    if (!respuestaApi.ok) {
      const estado = respuestaApi.status;
      const texto =
        estado === 429
          ? "Hay muchas personas preguntando en este momento. Intenta de nuevo en un minutito. 🙏"
          : "No pude responder ahora mismo. Intenta de nuevo en un momento, o revisa las preguntas frecuentes.";
      return Response.json({ error: "api_error", texto }, { headers: cors });
    }

    const datos = await respuestaApi.json();

    if (datos.stop_reason === "refusal") {
      return Response.json(
        { texto: "Esa pregunta no la puedo responder. Si es sobre deudas, plata o tus derechos como deudor, pregúntame con confianza." },
        { headers: cors },
      );
    }

    const bloqueTexto = (datos.content || []).find((b) => b.type === "text");
    return Response.json(
      { texto: bloqueTexto ? bloqueTexto.text : "No pude generar una respuesta. Intenta preguntar de otra forma." },
      { headers: cors },
    );
  },
};
