import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/salas/[id] - Obtener sala por ID
export async function GET(req, context) {
  const params = await context.params;
  const { id } = params;

  try {
    const sala = await prisma.sala.findUnique({
      where: { id: Number(id) },
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
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
                url_imagen: true,
                latitud: true,
                longitud: true,
                ubicacion: true,
                descripcion: true,
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

    if (!sala) {
      return new Response(
        JSON.stringify({
          error: "Sala no encontrada",
          message: `No se encontró una sala con ID ${id}`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(sala), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener sala por ID:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al obtener la sala",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// PUT /api/salas/[id] - Actualizar sala por ID
export async function PUT(req, context) {
  const params = await context.params;
  const { id } = params;

  try {
    const data = await req.json();

    // Preparar datos de actualización
    const updateData = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      publica: data.publica,
    };

    // Actualizar creador si se proporciona
    if (data.creadorId) {
      updateData.creador = { connect: { id: data.creadorId } };
    }

    // Actualizar colaboradores si se proporcionan
    if (data.colaboradores) {
      updateData.colaboradores = {
        set: data.colaboradores.map((id) => ({ id })),
      };
    }

    // Actualizar murales si se proporcionan
    if (data.murales) {
      // Primero eliminar todas las relaciones existentes
      await prisma.salaMural.deleteMany({
        where: { salaId: Number(id) },
      });

      // Luego crear las nuevas relaciones
      updateData.murales = {
        create: data.murales.map((muralId) => ({
          mural: { connect: { id: Number(muralId) } },
        })),
      };
    }

    const sala = await prisma.sala.update({
      where: { id: Number(id) },
      data: updateData,
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
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
                url_imagen: true,
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

    return new Response(JSON.stringify(sala), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al actualizar sala:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al actualizar la sala",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// DELETE /api/salas/[id] - Eliminar sala por ID
export async function DELETE(req, context) {
  const params = await context.params;
  const { id } = params;

  try {
    // Eliminar la sala (las relaciones se eliminan automáticamente por CASCADE)
    await prisma.sala.delete({
      where: { id: Number(id) },
    });

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Error al eliminar sala:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al eliminar la sala",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
