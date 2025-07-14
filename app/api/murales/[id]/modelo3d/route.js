import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import cloudinary from "../../../../../utils/cloudinary";

const prisma = new PrismaClient();

export async function POST(req, context) {
  const params = await context.params;
  const { id } = params;
  const muralId = Number(id);

  // Validar sesión y rol
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
    });
  }

  try {
    console.log(`📁 Iniciando subida de modelo 3D para mural ID: ${muralId}`);

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Content-Type debe ser multipart/form-data" }),
        { status: 415, headers: { "Content-Type": "application/json" } }
      );
    }

    const form = await req.formData();
    const file = form.get("modelo3d");

    if (!file || typeof file !== "object" || !file.type || !file.name) {
      return new Response(
        JSON.stringify({ error: "Archivo modelo3d (.glb) requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!file.name.endsWith(".glb")) {
      return new Response(
        JSON.stringify({ error: "Solo se permiten archivos .glb" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `📄 Archivo recibido: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    );

    // Subir a Cloudinary
    console.log("☁️ Iniciando subida a Cloudinary...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const upload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "modelos3d",
            resource_type: "raw",
            format: "glb",
            public_id: `modelo_mural_${muralId}_${Date.now()}`,
          },
          (err, result) => {
            if (err) {
              console.error("❌ Error en Cloudinary:", err);
              reject(err);
            } else {
              console.log("✅ Subida a Cloudinary exitosa:", result.secure_url);
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    const modelo3dUrl = upload.secure_url;

    // Actualizar mural
    console.log("💾 Actualizando base de datos...");
    const mural = await prisma.mural.update({
      where: { id: muralId },
      data: { modelo3dUrl },
    });

    console.log(`✅ Modelo 3D subido exitosamente para mural ID: ${muralId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Modelo 3D subido exitosamente",
        modelo3dUrl,
        fileInfo: {
          originalName: file.name,
          size: file.size,
          sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          uploadedAt: new Date().toISOString(),
        },
        muralId: muralId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error al subir modelo 3D:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno al subir modelo 3D",
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
