import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { SentryLogger } from "../../../lib/sentryLogger";

/**
 * @swagger
 * /api/collection:
 *   get:
 *     summary: Obtiene la colección de murales favoritos del usuario autenticado.
 *     tags: [Collection]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Una lista de los murales favoritos del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mural'
 *       401:
 *         description: No autorizado. El usuario no ha iniciado sesión.
 *       500:
 *         description: Error interno del servidor.
 */
export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }

  try {
    const userId = session.user.id;
    const userFavorites = await prisma.userMuralFavorite.findMany({
      where: { userId },
      include: {
        mural: true, // Incluir los datos completos del mural
      },
      orderBy: {
        addedAt: "desc",
      },
    });

    // Mapeamos para devolver solo la lista de murales
    const murals = userFavorites.map((fav) => fav.mural);

    return new Response(JSON.stringify(murals), { status: 200 });
  } catch (error) {
    console.error("Error al obtener la colección personal:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/collection:
 *   post:
 *     summary: Añade un mural a la colección de favoritos del usuario.
 *     tags: [Collection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               muralId:
 *                 type: string
 *                 description: El ID del mural a añadir.
 *     responses:
 *       201:
 *         description: Mural añadido exitosamente.
 *       400:
 *         description: El ID del mural es requerido.
 *       401:
 *         description: No autorizado.
 *       409:
 *         description: El mural ya está en la colección.
 *       500:
 *         description: Error interno del servidor.
 */
export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }

  try {
    const userId = session.user.id;
    const { muralId } = await req.json();

    if (!muralId) {
      return new Response(
        JSON.stringify({ error: "El ID del mural es requerido" }),
        { status: 400 }
      );
    }

    // Verificar si ya existe la relación
    const existingFavorite = await prisma.userMuralFavorite.findUnique({
      where: {
        userId_muralId: {
          userId,
          muralId,
        },
      },
    });

    if (existingFavorite) {
      return new Response(
        JSON.stringify({ message: "El mural ya está en la colección" }),
        { status: 200 }
      );
    }

    // Crear la relación
    const newFavorite = await prisma.userMuralFavorite.create({
      data: {
        userId,
        muralId,
      },
      include: {
        mural: true,
      },
    });

    // Log del evento en Sentry
    SentryLogger.collectionAdd(
      userId,
      muralId,
      newFavorite.mural?.titulo || "Mural sin título"
    );

    return new Response(JSON.stringify(newFavorite), { status: 201 });
  } catch (error) {
    console.error("Error al añadir a la colección:", error);
    if (error.code === "P2003") {
      // Foreign key constraint failed
      return new Response(
        JSON.stringify({ error: "El mural especificado no existe." }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/collection:
 *   delete:
 *     summary: Elimina un mural de la colección de favoritos del usuario.
 *     tags: [Collection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               muralId:
 *                 type: string
 *                 description: El ID del mural a eliminar.
 *     responses:
 *       200:
 *         description: Mural eliminado exitosamente.
 *       400:
 *         description: El ID del mural es requerido.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: El favorito a eliminar no fue encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
export async function DELETE(req) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }

  let muralId;
  try {
    const body = await req.text();
    if (body) {
      ({ muralId } = JSON.parse(body));
    }
  } catch (e) {
    // body inválido o vacío
  }

  if (!muralId) {
    return new Response(
      JSON.stringify({ error: "El ID del mural es requerido" }),
      { status: 400 }
    );
  }

  try {
    // Eliminar la relación
    await prisma.userMuralFavorite.delete({
      where: {
        userId_muralId: {
          userId: session.user.id,
          muralId,
        },
      },
    });

    // Log del evento en Sentry
    SentryLogger.collectionRemove(session.user.id, muralId);

    return new Response(
      JSON.stringify({ message: "Mural eliminado de la colección" }),
      { status: 200 }
    );
  } catch (error) {
    if (error.code === "P2025") {
      // Record to delete not found
      return new Response(
        JSON.stringify({
          error: "El mural no se encontró en la colección del usuario",
        }),
        { status: 404 }
      );
    }
    console.error("Error al eliminar de la colección:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}
