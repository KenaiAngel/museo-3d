import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth.js";
import { verifyAuth } from "../../../lib/verifyToken.js";

// Función helper para obtener usuario autenticado
async function getAuthenticatedUser(req) {
  // Primero intentar con JWT token
  const jwtUser = await verifyAuth(req);
  if (jwtUser) {
    return jwtUser;
  }

  // Si no hay JWT, intentar con sesión
  const session = await getServerSession(authOptions);
  if (session && session.user) {
    return session.user;
  }

  return null;
}

// GET /api/artists - Obtener todos los artistas
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"))
      : 50;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset"))
      : 0;

    const artists = await prisma.artist.findMany({
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
            url_imagen: true,
          },
        },
        _count: {
          select: {
            murales: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.artist.count();

    return new Response(
      JSON.stringify({
        artists,
        total: totalCount,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al obtener artistas:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al obtener artistas",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// POST /api/artists - Crear nuevo artista
export async function POST(req) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "No autorizado",
          message: "Debes estar autenticado para crear un artista",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await req.json();
    console.log("🆕 Creando artista:", data);

    // Usar el ID del usuario autenticado si no se proporciona userId
    const userId = data.userId || user.userId || user.id;

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "userId es requerido",
          message: "Debes proporcionar el ID del usuario",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verificar que el usuario existe
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userRecord) {
      return new Response(
        JSON.stringify({
          error: "Usuario no encontrado",
          message: "El usuario especificado no existe",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verificar que el usuario no sea ya un artista
    const existingArtist = await prisma.artist.findUnique({
      where: { userId: userId },
    });

    if (existingArtist) {
      return new Response(
        JSON.stringify({
          error: "Usuario ya es artista",
          message: "Este usuario ya tiene un perfil de artista",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Crear artista
    const artist = await prisma.artist.create({
      data: {
        userId: userId,
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

    console.log("✅ Artista creado:", artist.id);

    return new Response(
      JSON.stringify({
        message: "Artista creado exitosamente",
        artist,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al crear artista:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al crear artista",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
