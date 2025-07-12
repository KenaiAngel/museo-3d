import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { SentryLogger } from "../../../lib/sentryLogger";

export async function POST(req) {
  try {
    console.log("--- INICIO /api/upload ---");
    const contentType = req.headers.get("content-type") || "";
    console.log("Content-Type recibido:", contentType);
    if (!contentType.includes("multipart/form-data")) {
      console.log("Error: Content-Type no es multipart/form-data");
      return new Response(
        JSON.stringify({
          error:
            "La petición debe ser multipart/form-data para subir archivos.",
        }),
        {
          status: 415,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const form = await req.formData();
    console.log("FormData recibido");
    const file = form.get("imagen");
    if (!file || typeof file !== "object") {
      console.log("Error: No se recibió archivo");
      return new Response(JSON.stringify({ error: "No se recibió archivo." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Log para depuración
    console.log("Tipo de archivo recibido:", file.type);
    // Validar tipo de archivo (aceptar cualquier imagen)
    if (!file.type.startsWith("image/")) {
      console.log("Error: Archivo no es imagen");
      return new Response(
        JSON.stringify({ error: "Solo se aceptan archivos de imagen." }),
        {
          status: 415,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Buffer creado, subiendo a Cloudinary...");
    const folder = form.get("folder") || "murales";
    const upload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        })
        .end(buffer);
    });
    console.log("Imagen subida a Cloudinary:", upload.secure_url);

    // Log del evento en Sentry
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      SentryLogger.contentUpload(
        session.user.id,
        file.type || "unknown",
        file.size,
        file.name || "unnamed"
      );
    }

    return new Response(JSON.stringify({ url: upload.secure_url }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en /api/upload:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
