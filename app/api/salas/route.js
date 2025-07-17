import { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/sendEmail";
import { SentryLogger } from "../../../lib/sentryLogger";

const prisma = new PrismaClient();

// GET /api/salas - Obtener todas las salas
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const creadorId = searchParams.get("creadorId");

    // Construir filtros dinámicamente
    const where = {};
    if (creadorId) where.creadorId = creadorId;

    const salas = await prisma.sala.findMany({
      where,
      include: {
        creador: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        colaboradores: {
          select: {
            rol: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        murales: {
          include: {
            mural: {
              select: {
                id: true,
                titulo: true,
                autor: true,
                tecnica: true,
                anio: true,
                descripcion: true,
                url_imagen: true,
                latitud: true,
                longitud: true,
                ubicacion: true,
                artistId: true,
                artist: {
                  select: {
                    id: true,
                    bio: true,
                    especialidad: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            murales: true,
            colaboradores: true,
          },
        },
      },
      orderBy: [{ nombre: "asc" }],
    });

    // Agregar estadísticas
    const stats = {
      total: salas.length,
      totalMurales: salas.reduce((acc, sala) => acc + sala._count.murales, 0),
      totalColaboradores: salas.reduce(
        (acc, sala) => acc + sala._count.colaboradores,
        0
      ),
      salasConMurales: salas.filter((sala) => sala._count.murales > 0).length,
    };

    return new Response(
      JSON.stringify({
        salas,
        estadisticas: stats,
        filtros: {
          creadorId: creadorId || null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al obtener salas:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al obtener salas",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// POST /api/salas - Crear nueva sala
export async function POST(req) {
  try {
    const data = await req.json();

    // Validaciones
    if (!data.nombre || data.nombre.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Validación fallida",
          message: "El nombre de la sala es requerido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.creadorId) {
      return new Response(
        JSON.stringify({
          error: "Validación fallida",
          message: "El ID del creador es requerido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verificar que el usuario creador exista
    const creador = await prisma.user.findUnique({
      where: { id: data.creadorId },
    });

    if (!creador) {
      return new Response(
        JSON.stringify({
          error: "Usuario no encontrado",
          message: `No se encontró un usuario con ID ${data.creadorId}`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar que los murales existan si se proporcionan
    if (data.murales && data.murales.length > 0) {
      const existingMurales = await prisma.mural.findMany({
        where: {
          id: { in: data.murales.map((id) => Number(id)) },
        },
      });

      if (existingMurales.length !== data.murales.length) {
        const foundIds = existingMurales.map((m) => m.id);
        const missingIds = data.murales.filter(
          (id) => !foundIds.includes(Number(id))
        );

        return new Response(
          JSON.stringify({
            error: "Murales no encontrados",
            message: `Los siguientes murales no existen: ${missingIds.join(
              ", "
            )}`,
            found: foundIds,
            missing: missingIds,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Validar que los colaboradores existan si se proporcionan
    if (data.colaboradores && data.colaboradores.length > 0) {
      const existingColaboradores = await prisma.user.findMany({
        where: {
          id: { in: data.colaboradores },
        },
      });

      if (existingColaboradores.length !== data.colaboradores.length) {
        const foundIds = existingColaboradores.map((u) => u.id);
        const missingIds = data.colaboradores.filter(
          (id) => !foundIds.includes(id)
        );

        return new Response(
          JSON.stringify({
            error: "Colaboradores no encontrados",
            message: `Los siguientes usuarios no existen: ${missingIds.join(
              ", "
            )}`,
            found: foundIds,
            missing: missingIds,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Crear la sala
    const sala = await prisma.sala.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || "",
        publica: data.publica || false,
        creador: { connect: { id: data.creadorId } },
        colaboradores: {
          connect: data.colaboradores?.map((id) => ({ id })) || [],
        },
        murales: {
          create:
            data.murales?.map((muralId) => ({
              mural: { connect: { id: Number(muralId) } },
            })) || [],
        },
      },
      include: {
        creador: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        colaboradores: {
          select: {
            rol: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        murales: {
          include: {
            mural: {
              select: {
                id: true,
                titulo: true,
                autor: true,
                tecnica: true,
                anio: true,
                descripcion: true,
                url_imagen: true,
                latitud: true,
                longitud: true,
                ubicacion: true,
                artistId: true,
                artist: {
                  select: {
                    id: true,
                    bio: true,
                    especialidad: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            murales: true,
            colaboradores: true,
          },
        },
      },
    });

    // Log del evento en Sentry
    SentryLogger.roomCreated(
      data.creadorId,
      sala.id,
      sala.nombre,
      sala.publica
    );

    // Notificar a los suscriptores
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { OR: [{ type: "all" }, { type: "sala" }] },
        include: { user: true },
      });
      for (const sub of subscriptions) {
        if (!sub.user?.email) continue;
        await sendEmail({
          to: sub.user.email,
          subject: `Nueva sala creada: ${sala.nombre}`,
          html: `<p>Hola ${sub.user.name || "usuario"},</p>
            <p>Se ha creado una nueva sala: <b>${sala.nombre}</b>.</p>
            <p>Descripción: ${sala.descripcion || "Sin descripción"}</p>
            <p>Puedes verla en el <a href="https://museo-3d.vercel.app/mis-salas">Museo Virtual</a>.</p>
            <p style="margin-top:18px;font-size:14px;">
              <a href="https://museo-3d.vercel.app/perfil" style="color:#dc2626;font-weight:bold;">Cancelar suscripción a notificaciones</a>
            </p>`,
        });
      }
    } catch (notifyErr) {
      console.error("Error notificando suscriptores de sala:", notifyErr);
    }

    return new Response(JSON.stringify(sala), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al crear sala:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al crear la sala",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
