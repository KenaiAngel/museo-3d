import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth";
import cloudinary from "../../../../../utils/cloudinary";

const prisma = new PrismaClient();

export async function DELETE(req, context) {
  const params = await context.params;
  const { id } = params;

  // Validar sesión y rol
  const session = await getServerSession(authOptions);
  console.log("[DELETE mural] session:", session);
  if (!session || !session.user || session.user.role !== "ADMIN") {
    console.warn("[DELETE mural] No autorizado o sesión inválida", session);
    return new Response(
      JSON.stringify({ error: "No autorizado o sesión inválida" }),
      {
        status: 403,
      }
    );
  }

  try {
    // Obtener el mural antes de borrar
    const mural = await prisma.mural.findUnique({ where: { id: Number(id) } });
    console.log("[DELETE mural] mural:", mural);
    if (!mural) {
      console.warn(`[DELETE mural] Mural con id ${id} no encontrado`);
      return new Response(
        JSON.stringify({ error: `Mural con id ${id} no encontrado` }),
        {
          status: 404,
        }
      );
    }
    if (mural.url_imagen && mural.url_imagen.includes("cloudinary")) {
      try {
        // Extraer public_id de la url_imagen
        const url = new URL(mural.url_imagen);
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
    if (mural.modelo3dUrl && mural.modelo3dUrl.includes("cloudinary")) {
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
    console.error(
      "[DELETE mural] Error al eliminar mural permanentemente:",
      error
    );
    return new Response(
      JSON.stringify({
        error: "Error al eliminar mural permanentemente",
        details: error.message || String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
