import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }
  const { type = "all" } = await req.json();
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) throw new Error("Usuario no encontrado");
    await prisma.subscription.upsert({
      where: { userId_type: { userId: user.id, type } },
      update: {},
      create: { userId: user.id, type },
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }
  const { type = "all" } = await req.json();
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) throw new Error("Usuario no encontrado");
    await prisma.subscription.delete({
      where: { userId_type: { userId: user.id, type } },
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
