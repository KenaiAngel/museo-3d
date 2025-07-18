import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth"; // Ajusta la ruta según tu estructura
import cloudinary from "../../../../utils/cloudinary";

const prisma = new PrismaClient();

export async function DELETE(req, context) {
  const params = await context.params;
  const { id } = params;

  // Validar sesión y rol
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
    });
  }

  try {
    // Obtener el mural antes de borrar
    const mural = await prisma.mural.findUnique({ where: { id: Number(id) } });
    if (mural && mural.url_imagen && mural.url_imagen.includes("cloudinary")) {
      try {
        // Extraer public_id de la url_imagen
        const url = new URL(mural.url_imagen);
        // Ejemplo: https://res.cloudinary.com/daol1ohso/image/upload/v1234567890/murales/filename.jpg
        // public_id = murales/filename (sin extensión)
        const parts = url.pathname.split("/");
        const folder = parts[parts.length - 2];
        const filename = parts[parts.length - 1].split(".")[0];
        const public_id = `${folder}/${filename}`;
        await cloudinary.uploader.destroy(public_id, {
          resource_type: "image",
        });
      } catch (err) {
        console.warn(
          "No se pudo eliminar la imagen de Cloudinary:",
          err.message
        );
      }
    }
    // Eliminar modelo 3D de Cloudinary si existe
    if (
      mural &&
      mural.modelo3dUrl &&
      mural.modelo3dUrl.includes("cloudinary")
    ) {
      try {
        const url3d = new URL(mural.modelo3dUrl);
        const parts3d = url3d.pathname.split("/");
        const folder3d = parts3d[parts3d.length - 2];
        const filename3d = parts3d[parts3d.length - 1].split(".")[0];
        const public_id3d = `${folder3d}/${filename3d}`;
        await cloudinary.uploader.destroy(public_id3d, {
          resource_type: "raw",
        });
      } catch (err) {
        console.warn(
          "No se pudo eliminar el modelo 3D de Cloudinary:",
          err.message
        );
      }
    }
    await prisma.mural.delete({ where: { id: Number(id) } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error al eliminar mural permanentemente",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
