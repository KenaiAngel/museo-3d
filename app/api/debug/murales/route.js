import { prisma } from "../../../../lib/prisma.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check database connection
    const muralesCount = await prisma.mural.count();
    const salasCount = await prisma.sala.count();
    const usuariosCount = await prisma.usuario.count();

    // Get recent murales
    const recentMurales = await prisma.mural.findMany({
      take: 5,
      orderBy: { fechaCreacion: "desc" },
      include: {
        usuario: true,
        sala: true,
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        murales: muralesCount,
        salas: salasCount,
        usuarios: usuariosCount,
      },
      recentMurales: recentMurales.map((mural) => ({
        id: mural.id,
        titulo: mural.titulo,
        fechaCreacion: mural.fechaCreacion,
        usuario: mural.usuario?.nombre || "Unknown",
        sala: mural.sala?.nombre || "Unknown",
      })),
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
