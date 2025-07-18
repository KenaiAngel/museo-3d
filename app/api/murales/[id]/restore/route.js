import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req, context) {
  const params = await context.params;
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
    });
  }

  // Busca el mural y verifica ownership
  const mural = await prisma.mural.findUnique({ where: { id: Number(id) } });
  if (!mural) {
    return new Response(JSON.stringify({ error: "Mural no encontrado" }), {
      status: 404,
    });
  }

  // Solo el owner puede restaurar
  if (mural.userId !== session.user.id) {
    return new Response(
      JSON.stringify({ error: "No tienes permiso para restaurar este mural" }),
      { status: 403 }
    );
  }

  try {
    const restaurado = await prisma.mural.update({
      where: { id: Number(id) },
      data: { deletedAt: null },
    });
    return new Response(JSON.stringify({ success: true, mural: restaurado }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error al restaurar mural",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
