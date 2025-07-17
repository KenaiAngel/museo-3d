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

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscriptions: true },
    });
    if (!user) throw new Error("Usuario no encontrado");
    const found = user.subscriptions.find((s) => s.type === type);
    return new Response(JSON.stringify({ subscribed: !!found, type }), {
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
