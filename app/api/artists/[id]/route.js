import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth.js";

// GET /api/artists/[id] - Obtener artista por ID
export async function GET(req, context) {
  try {
    const params = await context.params;
    const { id } = params;

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        murales: {
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            url_imagen: true,
            anio: true,
            tecnica: true,
            ubicacion: true,
          },
        },
        _count: {
          select: {
            murales: true,
          },
        },
      },
    });

    if (!artist) {
      return new Response(
        JSON.stringify({
          error: "Artista no encontrado",
          message: "No se encontró un artista con ese ID",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(artist), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener artista:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al obtener artista",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// PUT /api/artists/[id] - Actualizar artista
export async function PUT(req, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const params = await context.params;
    const { id } = params;
    const data = await req.json();

    // Verificar que el artista existe
    const existingArtist = await prisma.artist.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingArtist) {
      return new Response(
        JSON.stringify({
          error: "Artista no encontrado",
          message: "No se encontró un artista con ese ID",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verificar permisos (solo el propio artista o admin puede actualizar)
    if (
      session.user.role !== "ADMIN" &&
      existingArtist.userId !== session.user.id
    ) {
      return new Response(
        JSON.stringify({
          error: "Acceso denegado",
          message: "Solo puedes actualizar tu propio perfil de artista",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Actualizar artista
    const updatedArtist = await prisma.artist.update({
      where: { id },
      data: {
        bio: data.bio,
        website: data.website,
        instagram: data.instagram,
        twitter: data.twitter,
        facebook: data.facebook,
        especialidad: data.especialidad,
        experiencia: data.experiencia,
        formacion: data.formacion,
        premios: data.premios,
        exposiciones: data.exposiciones,
        publicaciones: data.publicaciones,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        message: "Artista actualizado exitosamente",
        artist: updatedArtist,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al actualizar artista:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al actualizar artista",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// DELETE /api/artists/[id] - Eliminar artista
export async function DELETE(req, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const params = await context.params;
    const { id } = params;

    // Verificar que el artista existe
    const existingArtist = await prisma.artist.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingArtist) {
      return new Response(
        JSON.stringify({
          error: "Artista no encontrado",
          message: "No se encontró un artista con ese ID",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verificar permisos (solo admin puede eliminar)
    if (session.user.role !== "ADMIN") {
      return new Response(
        JSON.stringify({
          error: "Acceso denegado",
          message: "Solo los administradores pueden eliminar artistas",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Eliminar artista
    await prisma.artist.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({
        message: "Artista eliminado exitosamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al eliminar artista:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al eliminar artista",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
