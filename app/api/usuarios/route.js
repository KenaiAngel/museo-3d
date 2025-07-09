import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth.js";

const prisma = new PrismaClient();

// GET /api/usuarios - Obtener usuarios (solo admin) o verificar disponibilidad de nombre
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const search = searchParams.get("search");

    // Si se proporciona un nombre, verificar disponibilidad (no requiere autenticación)
    if (name) {
      const existingUser = await prisma.user.findFirst({
        where: { name: name },
        select: { id: true, name: true },
      });

      return new Response(
        JSON.stringify({
          name,
          available: !existingUser,
          exists: !!existingUser,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // NUEVO: búsqueda flexible por nombre o email
    if (search) {
      const role = searchParams.get("role");
      const usuarios = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
            ...(role ? [{ role: role }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
        take: 20,
        orderBy: { name: "asc" },
      });
      return new Response(JSON.stringify({ usuarios }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Si no hay nombre, obtener lista de usuarios (requiere autenticación de admin)
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verificar si el usuario es admin
    if (session.user.role !== "ADMIN") {
      return new Response(
        JSON.stringify({
          error: "Acceso denegado - Se requieren permisos de administrador",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const role = searchParams.get("role");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit"))
      : 50;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset"))
      : 0;

    // Construir filtros
    const where = {};
    if (role) where.role = role;

    const usuarios = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        _count: {
          select: {
            salasPropias: true,
            salasColabora: true,
            favoritedBy: true,
          },
        },
      },
      orderBy: { id: "desc" },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.user.count({ where });

    return new Response(
      JSON.stringify({
        usuarios,
        total: totalCount,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
        filtros: {
          role: role || null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al obtener usuarios",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// POST /api/usuarios - Crear usuario (admin o registro público)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const data = await req.json();
    console.log("Datos recibidos para crear usuario:", data);

    // Permitir registro público si no hay sesión
    if (!session) {
      if (!data.email || !data.name) {
        console.log("Datos incompletos (registro público)");
        return new Response(
          JSON.stringify({
            error: "Datos incompletos",
            message: "email y name son requeridos",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        console.log("Usuario ya existe (registro público):", data.email);
        return new Response(
          JSON.stringify({
            error: "Usuario ya existe",
            message: "Ya existe un usuario con ese email",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      // Crear usuario público
      const usuario = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password, // Puede venir hasheada desde el registro
          role: "USER",
          image: data.image,
          settings: data.settings || {},
          emailVerified: data.emailVerified || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      });
      console.log("Usuario creado (registro público):", usuario);
      return new Response(
        JSON.stringify({
          message: "Usuario creado exitosamente",
          usuario,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Si hay sesión, solo admin puede crear
    if (!session.user) {
      console.log("No autorizado");
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (session.user.role !== "ADMIN") {
      console.log("Acceso denegado - No es admin");
      return new Response(
        JSON.stringify({
          error: "Acceso denegado - Se requieren permisos de administrador",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.email || !data.name) {
      console.log("Datos incompletos");
      return new Response(
        JSON.stringify({
          error: "Datos incompletos",
          message: "email y name son requeridos",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log("Usuario ya existe:", data.email);
      return new Response(
        JSON.stringify({
          error: "Usuario ya existe",
          message: "Ya existe un usuario con ese email",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Aquí puedes loggear los datos que vas a insertar
    console.log("Creando usuario en la base de datos:", data);

    const usuario = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role || "USER",
        image: data.image,
        settings: data.settings || {},
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    console.log("Usuario creado:", usuario);

    return new Response(
      JSON.stringify({
        message: "Usuario creado exitosamente",
        usuario,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al crear usuario",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
