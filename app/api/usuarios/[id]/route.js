import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth.js";

const prisma = new PrismaClient();

// GET /api/usuarios/[id] - Obtener usuario por ID
export async function GET(req, context) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const { id } = params;

    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verificar permisos: solo admin o el propio usuario
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        settings: true,
        salasPropias: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            publica: true,
            createdAt: true,
            _count: {
              select: {
                murales: true,
                colaboradores: true,
              },
            },
          },
        },
        salasColabora: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            publica: true,
            createdAt: true,
            _count: {
              select: {
                murales: true,
                colaboradores: true,
              },
            },
          },
        },
        personalCollection: {
          select: {
            id: true,
            items: {
              select: {
                id: true,
                artworkId: true,
                artworkType: true,
                addedAt: true,
              },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
        },
        _count: {
          select: {
            salasPropias: true,
            salasColabora: true,
            personalCollection: true,
          },
        },
      },
    });

    if (!usuario) {
      return new Response(
        JSON.stringify({
          error: "Usuario no encontrado",
          message: `No se encontró un usuario con ID ${id}`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(usuario), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al obtener el usuario",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// PUT /api/usuarios/[id] - Actualizar usuario
export async function PUT(req, context) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const { id } = params;

    console.log("🔄 PUT /api/usuarios/[id]: Updating user", {
      id,
      sessionUser: session?.user?.email,
    });

    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verificar permisos: solo admin o el propio usuario
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await req.json();
    console.log("📊 PUT /api/usuarios/[id]: Update data received", data);

    // Preparar datos de actualización
    const updateData = {};

    // Campos que cualquier usuario puede actualizar
    if (data.name !== undefined) updateData.name = data.name;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.settings !== undefined) updateData.settings = data.settings;

    // Campos que solo admin puede actualizar
    if (session.user.role === "ADMIN") {
      if (data.email !== undefined) updateData.email = data.email;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.emailVerified !== undefined) {
        updateData.emailVerified = data.emailVerified
          ? new Date(data.emailVerified)
          : null;
      }
    }

    console.log("🔄 PUT /api/usuarios/[id]: Update data to save", updateData);

    const usuario = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        settings: true,
      },
    });

    console.log(
      "✅ PUT /api/usuarios/[id]: User updated successfully",
      usuario
    );

    return new Response(
      JSON.stringify({
        message: "Usuario actualizado exitosamente",
        usuario,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("❌ PUT /api/usuarios/[id]: Error updating user:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al actualizar el usuario",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// PATCH /api/usuarios/[id] - Alias de PUT para compatibilidad
export const PATCH = PUT;

// POST /api/usuarios/[id]/collection - Agregar mural a la colección personal
export async function POST(req, context) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const { id } = params;
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { muralId } = await req.json();
    if (!muralId) {
      return new Response(JSON.stringify({ error: "Falta muralId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Crear favorito si no existe
    const existing = await prisma.userMuralFavorite.findUnique({
      where: { userId_muralId: { userId: id, muralId } },
    });
    if (existing) {
      return new Response(
        JSON.stringify({ message: "Ya está en la colección" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const fav = await prisma.userMuralFavorite.create({
      data: { userId: id, muralId },
    });
    return new Response(JSON.stringify({ success: true, fav }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE /api/usuarios/[id]/collection - Quitar mural de la colección personal
export async function DELETE(req, context) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const { id } = params;
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { muralId } = await req.json();
    if (!muralId) {
      return new Response(JSON.stringify({ error: "Falta muralId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    await prisma.userMuralFavorite.delete({
      where: { userId_muralId: { userId: id, muralId } },
    });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
