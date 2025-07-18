import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/utils/sendPushNotification";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }
  const {
    message = "¡Notificación push de prueba!",
    url = "https://museo-3d.vercel.app/",
  } = await req.json();
  try {
    const allSubs = await prisma.pushSubscription.findMany();
    let sent = 0;
    for (const sub of allSubs) {
      const payload = {
        title: "Museo 3D",
        body: message,
        url,
      };
      try {
        const ok = await sendPushNotification(sub, payload);
        if (ok) sent++;
      } catch (e) {
        // Ignorar error individual
      }
    }
    return new Response(JSON.stringify({ sent, total: allSubs.length }), {
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
