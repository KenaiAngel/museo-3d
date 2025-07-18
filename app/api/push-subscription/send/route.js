import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/utils/sendPushNotification";

export async function POST(req) {
  try {
    const { email, message } = await req.json();
    if (!email || !message) {
      return new Response(JSON.stringify({ error: "Faltan parámetros" }), { status: 400 });
    }
    // Buscar usuario por email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 404 });
    }
    // Buscar todas las suscripciones push del usuario
    const subs = await prisma.pushSubscription.findMany({ where: { userId: user.id } });
    if (!subs.length) {
      return new Response(JSON.stringify({ error: "El usuario no tiene suscripciones push" }), { status: 404 });
    }
    // Enviar notificación a cada suscripción
    let success = 0;
    let fail = 0;
    for (const sub of subs) {
      try {
        await sendPushNotification(sub, { title: "Notificación Museo 3D", body: message });
        success++;
      } catch (err) {
        fail++;
      }
    }
    return new Response(JSON.stringify({ success, fail }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 