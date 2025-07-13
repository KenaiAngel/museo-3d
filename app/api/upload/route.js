export const runtime = "nodejs";
import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { SentryLogger } from "../../../lib/sentryLogger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    // Validar tipo de archivo (permitir imágenes y modelos 3D)
    const allowedTypes = [
      "image/",
      "model/gltf-binary", // .glb
      "model/gltf+json", // .gltf
      "application/octet-stream", // algunos .glb pueden venir como esto
      "model/obj",
      "model/stl",
      "application/zip", // modelos comprimidos
    ];
    
    const isImage = file.type.startsWith("image/");
    const isModel = allowedTypes.some((t) => file.type === t) || 
                   file.name?.endsWith(".glb") ||
                   file.name?.endsWith(".gltf") ||
                   file.name?.endsWith(".obj") ||
                   file.name?.endsWith(".stl");
    
    // Log adicional para debug de tipos de archivo
    console.log("Validación de archivo:", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      isImage,
      isModel
    });
    if (!isImage && !isModel) {
      console.log("Error: Archivo no permitido", file.type, file.name);
      return new Response(
        JSON.stringify({
          error:
            "Solo se aceptan imágenes o modelos 3D (.glb, .gltf, .obj, .stl).",
        }),
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
    // Subir como imagen o como raw (modelo 3D)
    const resource_type = isImage ? "image" : "raw";
    // Usar el nombre de archivo (con extensión) como public_id
    let public_id = undefined;
    if (file.name) {
      public_id = file.name; // Mantener la extensión
    }
    const upload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder, resource_type, ...(public_id && { public_id }) },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        )
        .end(buffer);
    });
    console.log("Archivo subido a Cloudinary:", upload.secure_url);

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
