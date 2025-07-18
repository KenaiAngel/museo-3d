import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth.js";

const prisma = new PrismaClient();

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
    });
  }

  // Buscar todos los murales eliminados
  const murales = await prisma.mural.findMany({
    where: { deletedAt: { not: null } },
    include: {
      user: {
        select: { id: true, name: true, email: true, settings: true },
      },
    },
  });

  // Agrupar por usuario
  const agrupados = {};
  for (const mural of murales) {
    const userId = mural.userId || "sin_usuario";
    if (!agrupados[userId]) {
      agrupados[userId] = {
        user: mural.user || null,
        murales: [],
      };
    }
    agrupados[userId].murales.push(mural);
  }

  return new Response(JSON.stringify(agrupados), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
