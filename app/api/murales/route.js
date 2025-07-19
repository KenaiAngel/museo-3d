import { prisma } from "../../../lib/prisma";
import cloudinary from "../../../utils/cloudinary";
import { sendEmail } from "@/lib/sendEmail";
import { sendPushNotification } from "@/utils/sendPushNotification";

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
    const page = parseInt(searchParams.get("page"),10);

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
    //Consulta el total de elementos dentro de la base de datos
    const total = await prisma.mural.count({ where });
    // En caso de existir PAGE hacer uso de take and skip para la busqueda por paginas
    let skip;
    let take;
    let infoPaginacion;
    
    if(page) {
      take = 10;
      skip = (page - 1) * take;
      infoPaginacion = {
        total, 
        'currentPage': page, 
        'totalPages': Math.ceil(total/take),
        'itemsPerPage' : take,
      }
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
      // Si existe paginacion, buscar en base a skip and take 
      ...{skip},
      ...{take}
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
          paginationInfo: infoPaginacion || null,
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

    console.log("📥 API recibiendo datos con Content-Type:", contentType);

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

    console.log("📋 Datos recibidos en la API:", {
      titulo: data.titulo,
      tecnica: data.tecnica,
      anio: data.anio,
      descripcion: data.descripcion,
      autor: data.autor,
      artistId: data.artistId,
      userId: data.userId,
      url_imagen: data.url_imagen,
      modelo3dUrl: data.modelo3dUrl,
      dimensiones: data.dimensiones,
      latitud: data.latitud,
      longitud: data.longitud,
      ubicacion: data.ubicacion,
      salaId: data.salaId,
      estado: data.estado,
      publica: data.publica,
      destacada: data.destacada,
      orden: data.orden,
      tags: data.tags,
      colaboradores: data.colaboradores,
    });

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
    const existing = await prisma.mural
      .findFirst({
        where: { titulo: data.titulo },
      })
      .catch((error) => {
        console.error("Error verificando mural existente:", error);
        return null;
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

    // Validar que el artistId existe si se proporciona
    if (data.artistId && data.artistId.trim() !== "") {
      const artistExists = await prisma.artist
        .findUnique({
          where: { id: data.artistId },
        })
        .catch((error) => {
          console.error("Error verificando artista:", error);
          return null;
        });
      if (!artistExists) {
        return new Response(
          JSON.stringify({
            error: "El artista seleccionado no existe en la base de datos.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const mural = await prisma.mural.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion || "",
        autor: data.autor || data.artista || "Artista desconocido",
        tecnica: data.tecnica || "Técnica no especificada",
        ubicacion: data.ubicacion || "",
        url_imagen,
        modelo3dUrl: data.modelo3dUrl || null,
        latitud: data.latitud ? parseFloat(data.latitud) : null,
        longitud: data.longitud ? parseFloat(data.longitud) : null,
        anio: data.anio ? Number(data.anio) : null,
        artistId:
          data.artistId && data.artistId.trim() !== "" ? data.artistId : null,
        userId: data.userId || null,
        // Campos faltantes
        dimensiones: data.dimensiones || null,
        salaId: data.salaId ? Number(data.salaId) : null,
        estado: data.estado || null,
        publica: data.publica ? data.publica === "true" : true,
        destacada: data.destacada ? data.destacada === "true" : false,
        orden: data.orden ? Number(data.orden) : 0,
        tags: data.tags ? JSON.parse(data.tags) : null,
      },
    });

    // Crear relaciones de colaboradores si existen
    if (data.colaboradores) {
      try {
        const colaboradores = JSON.parse(data.colaboradores);
        if (Array.isArray(colaboradores) && colaboradores.length > 0) {
          const colaboradoresData = colaboradores.map((colaboradorId) => ({
            muralId: mural.id,
            userId: colaboradorId,
          }));

          await prisma.muralColaborador.createMany({
            data: colaboradoresData,
            skipDuplicates: true,
          });

          console.log(
            `✅ ${colaboradoresData.length} colaboradores agregados al mural ${mural.id}`
          );
        }
      } catch (error) {
        console.error("❌ Error creando colaboradores:", error);
        // No fallar la creación del mural por error en colaboradores
      }
    }

    // Notificar a los suscriptores por email (ya existente)
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
            <p style="margin-top:18px;font-size:14px;">
              <a href="https://museo-3d.vercel.app/perfil" style="color:#dc2626;font-weight:bold;">Cancelar suscripción a notificaciones</a>
            </p>`,
        });
      }
    } catch (notifyErr) {
      console.error("Error notificando suscriptores de obra:", notifyErr);
    }

    // Notificar a los suscriptores push
    try {
      const pushSubs = await prisma.pushSubscription.findMany(); // Quitar filtro de exclusión
      console.log("Enviando push a", pushSubs.length, "usuarios");
      for (const sub of pushSubs) {
        const payload = {
          title: "¡Nueva obra publicada!",
          body: `Se ha publicado \"${mural.titulo}\" por ${mural.autor}`,
          url: `https://museo-3d.vercel.app/galeria/${mural.id}`,
          icon: "/icon.png",
        };
        await sendPushNotification(sub, payload);
      }
    } catch (err) {
      console.error("Error enviando notificaciones push:", err);
    }

    return new Response(JSON.stringify(mural), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al crear mural:", error);

    // Manejar errores específicos de base de datos
    if (error.message.includes("connection pool timeout")) {
      return new Response(
        JSON.stringify({
          error:
            "Error de conexión con la base de datos. Intenta de nuevo en unos momentos.",
          details: "Connection pool timeout",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error.message.includes("Invalid `prisma.mural.findFirst()`")) {
      return new Response(
        JSON.stringify({
          error:
            "Error de validación en la base de datos. Verifica los datos enviados.",
          details: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al crear mural",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
