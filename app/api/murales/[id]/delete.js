import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth"; // Ajusta la ruta según tu estructura

const prisma = new PrismaClient();

export async function DELETE(req, context) {
  const params = await context.params;
  const { id } = params;

  // Validar sesión y rol
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
    });
  }

  try {
    await prisma.mural.delete({ where: { id: Number(id) } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error al eliminar mural permanentemente",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
