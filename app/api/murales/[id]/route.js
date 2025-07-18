import { PrismaClient } from "@prisma/client";
import cloudinary from "../../../../utils/cloudinary";

const prisma = new PrismaClient();

// GET /api/murales/[id]
export async function GET(req, context) {
  const params = await context.params;
  const { id } = params;
  const muralId = Number(id);

  if (!id || isNaN(muralId)) {
    return new Response(
      JSON.stringify({
        error: "ID de mural inválido",
        message: "El parámetro 'id' es requerido y debe ser un número.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const mural = await prisma.mural.findUnique({
      where: { id: muralId },
      include: {
        SalaMural: {
          include: {
            sala: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                creadorId: true,
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
                    id: true,
                    rol: true,
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
              },
            },
          },
        },
      },
    });

    if (!mural) {
      return new Response(
        JSON.stringify({
          error: "Mural no encontrado",
          message: `No se encontró un mural con ID ${id}`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(mural), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al obtener mural por ID:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al obtener el mural",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// PUT /api/murales/[id]
export async function PUT(req, context) {
  const params = await context.params;
  const { id } = params;
  const muralId = Number(id);

  if (!id || isNaN(muralId)) {
    return new Response(
      JSON.stringify({
        error: "ID de mural inválido",
        message: "El parámetro 'id' es requerido y debe ser un número.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let data;
    let file;
    let url_imagen = undefined;

    if (contentType.includes("application/json")) {
      data = await req.json();
      url_imagen = data.url_imagen || data.imagenUrl;
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      data = Object.fromEntries(form.entries());
      file = form.get("imagen");
      url_imagen = data.url_imagen || data.imagenUrl;
      // Si recibimos archivo, subimos a Cloudinary
      if (
        file &&
        typeof file === "object" &&
        file.type &&
        file.type.startsWith("image/")
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const upload = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "murales" }, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            })
            .end(buffer);
        });
        url_imagen = upload.secure_url;
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Content-Type no soportado." }),
        {
          status: 415,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Filtrar solo los campos válidos para el modelo Prisma
    const allowedFields = [
      "titulo",
      "descripcion",
      "autor",
      "tecnica",
      "ubicacion",
      "url_imagen",
      "modelo3dUrl",
      "latitud",
      "longitud",
      "anio",
      "artistId",
      "userId",
      "dimensiones",
      "estado",
      "imagenUrl",
      "imagenUrlWebp",
      "salaId",
      "exposiciones",
      "publica",
      "destacada",
      "deletedAt",
      "tags",
      "orden",
      "visitas",
    ];
    const updateData = {};
    for (const key of allowedFields) {
      if (key === "url_imagen" || key === "imagenUrl") {
        if (url_imagen !== undefined) updateData[key] = url_imagen;
      } else if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }
    // Conversión de tipos para algunos campos
    if (updateData.latitud !== undefined && updateData.latitud !== null) {
      updateData.latitud = parseFloat(updateData.latitud);
    }
    if (updateData.longitud !== undefined && updateData.longitud !== null) {
      updateData.longitud = parseFloat(updateData.longitud);
    }
    if (updateData.anio !== undefined && updateData.anio !== null) {
      updateData.anio = Number(updateData.anio);
    }
    // Actualizar mural
    const mural = await prisma.mural.update({
      where: { id: muralId },
      data: updateData,
      include: {
        SalaMural: {
          include: {
            sala: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                creador: {
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
    });

    return new Response(JSON.stringify(mural), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al actualizar mural:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al actualizar el mural",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// DELETE /api/murales/[id]
export async function DELETE(req, context) {
  const params = await context.params;
  const { id } = params;
  const muralId = Number(id);

  if (!id || isNaN(muralId)) {
    return new Response(
      JSON.stringify({
        error: "ID de mural inválido",
        message: "El parámetro 'id' es requerido y debe ser un número.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Soft delete: actualiza deletedAt
    const mural = await prisma.mural.update({
      where: { id: muralId },
      data: { deletedAt: new Date() },
    });
    return new Response(JSON.stringify({ success: true, mural }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error al eliminar mural",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
