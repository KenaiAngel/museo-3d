import { PrismaClient } from "@prisma/client";
import cloudinary from "../../../utils/cloudinary";

const prisma = new PrismaClient();

// GET /api/murales/[id]
export async function GET(req, context) {
  const params = await context.params;
  const { id } = params;

  try {
    const mural = await prisma.mural.findUnique({
      where: { id: Number(id) },
      include: {
        salas: {
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

    // Actualizar mural
    const mural = await prisma.mural.update({
      where: { id: Number(id) },
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        artista: data.artista,
        tecnica: data.tecnica,
        fechaCreacion: data.fechaCreacion ? new Date(data.fechaCreacion) : null,
        ubicacion: data.ubicacion,
        dimensiones: data.dimensiones,
        estado: data.estado,
        url_imagen: url_imagen,
        imagenUrl: url_imagen, // por compatibilidad
        imagenUrlWebp: data.imagenUrlWebp,
        latitud: data.latitud ? parseFloat(data.latitud) : null,
        longitud: data.longitud ? parseFloat(data.longitud) : null,
        anio: data.anio
          ? Number(data.anio)
          : data.year
          ? Number(data.year)
          : null,
      },
      include: {
        salas: {
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

  try {
    await prisma.mural.delete({
      where: { id: Number(id) },
    });

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Error al eliminar mural:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al eliminar el mural",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
