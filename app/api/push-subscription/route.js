import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }
  const data = await req.json();
  if (!data.endpoint || !data.keys) {
    return new Response(JSON.stringify({ error: "Datos incompletos" }), {
      status: 400,
    });
  }
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: {
        userId: session.user.id,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        keys: data.keys,
      },
      create: {
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userId: session.user.id,
        keys: data.keys,
      },
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }
  const data = await req.json();
  if (!data.endpoint) {
    return new Response(JSON.stringify({ error: "Endpoint requerido" }), {
      status: 400,
    });
  }
  try {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: data.endpoint, userId: session.user.id },
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
