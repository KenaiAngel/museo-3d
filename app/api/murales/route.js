import { PrismaClient } from "@prisma/client";
import cloudinary from "../../../utils/cloudinary";
import { sendEmail } from "@/lib/sendEmail";

const prisma = new PrismaClient();

// GET - Obtener todos los murales
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const salaId = searchParams.get("salaId");
    const autor = searchParams.get("autor");
    const tecnica = searchParams.get("tecnica");
    const anio = searchParams.get("anio");
    const deleted = searchParams.get("deleted");
    const userId = searchParams.get("userId");

    // Construir filtros dinámicamente
    const where = {};
    if (autor) where.autor = { contains: autor, mode: "insensitive" };
    if (tecnica) where.tecnica = { contains: tecnica, mode: "insensitive" };
    if (anio) where.anio = Number(anio);
    if (deleted === "1") where.deletedAt = { not: null };
    if (userId) where.userId = userId;

    // Si se especifica salaId, buscar murales que pertenezcan a esa sala
    if (salaId) {
      where.SalaMural = {
        some: {
          salaId: Number(salaId),
        },
      };
    }

    const murales = await prisma.mural.findMany({
      where,
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
      orderBy: [{ anio: "desc" }, { titulo: "asc" }],
    });

    // Agregar estadísticas
    const stats = {
      total: murales.length,
      porSala: {},
      porTecnica: {},
      porAnio: {},
    };

    murales.forEach((mural) => {
      // Estadísticas por sala
      if (mural.SalaMural.length > 0) {
        mural.SalaMural.forEach((salaMural) => {
          const salaNombre = salaMural.sala.nombre;
          stats.porSala[salaNombre] = (stats.porSala[salaNombre] || 0) + 1;
        });
      } else {
        stats.porSala["Sin sala"] = (stats.porSala["Sin sala"] || 0) + 1;
      }

      // Estadísticas por técnica
      if (mural.tecnica) {
        stats.porTecnica[mural.tecnica] =
          (stats.porTecnica[mural.tecnica] || 0) + 1;
      }

      // Estadísticas por año
      if (mural.anio) {
        stats.porAnio[mural.anio] = (stats.porAnio[mural.anio] || 0) + 1;
      }
    });

    return new Response(
      JSON.stringify({
        murales,
        estadisticas: stats,
        filtros: {
          salaId: salaId || null,
          autor: autor || null,
          tecnica: tecnica || null,
          anio: anio || null,
          deleted: deleted || null,
          userId: userId || null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al obtener murales:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al obtener murales",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let data;
    let file;

    if (contentType.includes("application/json")) {
      data = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      data = Object.fromEntries(form.entries());
      file = form.get("imagen");
    } else {
      return new Response(
        JSON.stringify({ error: "Content-Type no soportado." }),
        {
          status: 415,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let url_imagen = data.url_imagen || data.imagenUrl;

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

    if (!url_imagen) {
      return new Response(
        JSON.stringify({
          error:
            "Debes proporcionar la URL de la imagen subida a Cloudinary o un archivo imagen.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar que el título esté presente y sea string
    if (!data.titulo || typeof data.titulo !== "string") {
      return new Response(
        JSON.stringify({ error: "El título de la obra es obligatorio." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    // Validar que no exista un mural con el mismo título
    const existing = await prisma.mural.findFirst({
      where: { titulo: data.titulo },
    });
    if (existing) {
      return new Response(
        JSON.stringify({
          message:
            "Ya existe una obra con ese nombre. Elige un título diferente.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const mural = await prisma.mural.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion || "",
        autor: data.autor || data.artista || "Artista desconocido",
        tecnica: data.tecnica || "Técnica no especificada",
        ubicacion: data.ubicacion || "",
        url_imagen,
        latitud: data.latitud ? parseFloat(data.latitud) : null,
        longitud: data.longitud ? parseFloat(data.longitud) : null,
        anio: data.anio ? Number(data.anio) : null,
        artistId: data.artistId || null,
      },
    });

    // Notificar a los suscriptores
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { OR: [{ type: "all" }, { type: "obra" }] },
        include: { user: true },
      });
      for (const sub of subscriptions) {
        if (!sub.user?.email) continue;
        await sendEmail({
          to: sub.user.email,
          subject: `Nueva obra creada: ${mural.titulo}`,
          html: `<p>Hola ${sub.user.name || "usuario"},</p>
            <p>Se ha creado una nueva obra: <b>${mural.titulo}</b>.</p>
            <p>Autor: ${mural.autor || "Desconocido"}</p>
            <p>Puedes verla en la <a href="https://museo-3d.vercel.app/galeria">Galería del Museo Virtual</a>.</p>
            <p>Si no deseas recibir más notificaciones, puedes desuscribirte desde tu perfil.</p>`,
        });
      }
    } catch (notifyErr) {
      console.error("Error notificando suscriptores de obra:", notifyErr);
    }

    return new Response(JSON.stringify(mural), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al crear mural:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
