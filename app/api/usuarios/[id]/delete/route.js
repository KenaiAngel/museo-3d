import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth.js";

const prisma = new PrismaClient();

/**
 * DELETE /api/usuarios/[id]/delete - Eliminar usuario con validaciones de seguridad
 *
 * IMPLEMENTACIÓN SEGURA que:
 * 1. Valida permisos de administrador
 * 2. Verifica implicaciones antes de eliminar
 * 3. Ofrece opciones de preservación de datos
 * 4. Registra la eliminación para auditoría
 */
export async function DELETE(req, context) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const { id } = params;
    const body = await req.json();
    const {
      forceDelete = false,
      preserveContent = true,
      reassignToAdmin = false,
      adminUserId = session.user.id, // Usar el admin actual por defecto
    } = body;

    // 1. VERIFICACIÓN DE PERMISOS
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return new Response(
        JSON.stringify({
          error:
            "Acceso denegado. Solo administradores pueden eliminar usuarios.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. PREVENIR AUTO-ELIMINACIÓN
    if (session.user.id === id) {
      return new Response(
        JSON.stringify({
          error: "No puedes eliminar tu propia cuenta de administrador.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. VERIFICAR QUE EL USUARIO EXISTE
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            salasPropias: true,
            salasColabora: true,
            Mural: true,
            muralesColabora: true,
            favoritedBy: true,
            accounts: true,
            sessions: true,
            pushSubscriptions: true,
            subscriptions: true,
          },
        },
        artist: {
          select: {
            id: true,
            bio: true,
            especialidad: true,
          },
        },
        salasPropias: {
          select: {
            id: true,
            nombre: true,
            publica: true,
            _count: {
              select: {
                murales: true,
                colaboradores: true,
              },
            },
          },
        },
        Mural: {
          select: {
            id: true,
            titulo: true,
            publica: true,
          },
        },
      },
    });

    if (!userToDelete) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. ANÁLISIS DE IMPACTO
    const impact = {
      salasCreadas: userToDelete._count.salasPropias,
      salasColabora: userToDelete._count.salasColabora,
      muralesCreados: userToDelete._count.Mural,
      muralesColabora: userToDelete._count.muralesColabora,
      esArtista: userToDelete.artist !== null,
      tieneColeccionPersonal: userToDelete._count.favoritedBy > 0,
      salasPublicas: userToDelete.salasPropias.filter((s) => s.publica).length,
      muralesPublicos: userToDelete.Mural.filter((m) => m.publica).length,
    };

    // 5. VALIDACIONES DE SEGURIDAD
    // Recopilar advertencias para análisis y logging
    const warnings = [];

    if (impact.salasCreadas > 0) {
      warnings.push(`El usuario tiene ${impact.salasCreadas} salas creadas`);
    }

    if (impact.muralesCreados > 0) {
      warnings.push(
        `El usuario tiene ${impact.muralesCreados} murales creados`
      );
    }

    if (impact.salasPublicas > 0) {
      warnings.push(
        `${impact.salasPublicas} salas públicas se verán afectadas`
      );
    }

    if (impact.muralesPublicos > 0) {
      warnings.push(
        `${impact.muralesPublicos} murales públicos se verán afectados`
      );
    }

    if (impact.esArtista) {
      warnings.push(
        "El usuario tiene un perfil de artista con información profesional"
      );
    }

    // Solo bloquear si NO se está forzando la eliminación Y no se preserva contenido
    if (warnings.length > 0 && !forceDelete && !preserveContent) {
      return new Response(
        JSON.stringify({
          error: "Eliminación bloqueada por seguridad",
          warnings,
          impact,
          suggestions: [
            "Use forceDelete: true para forzar la eliminación",
            "Use preserveContent: true para mantener el contenido",
            "Use reassignToAdmin: true para reasignar contenido a un admin",
          ],
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Si hay advertencias pero se permite la eliminación, registrar en logs
    if (warnings.length > 0) {
      console.log(`[ADMIN WARNING] Eliminación con advertencias:`, {
        userId: id,
        adminUser: session.user.id,
        forceDelete,
        preserveContent,
        warnings,
        impact,
        timestamp: new Date().toISOString(),
      });
    }

    // 6. ESTRATEGIAS DE ELIMINACIÓN
    // IMPORTANTE: El orden de eliminación es crítico para evitar violaciones de FK

    await prisma.$transaction(async (tx) => {
      if (preserveContent) {
        // ESTRATEGIA 1: PRESERVAR CONTENIDO

        if (reassignToAdmin) {
          // Reasignar propiedad al admin actual
          await tx.sala.updateMany({
            where: { creadorId: id },
            data: { creadorId: adminUserId },
          });

          await tx.mural.updateMany({
            where: { userId: id },
            data: { userId: adminUserId },
          });
        } else {
          // Desasociar pero mantener contenido - SIEMPRE reasignar salas a admin
          await tx.mural.updateMany({
            where: { userId: id },
            data: {
              userId: null,
              autor:
                userToDelete.name || userToDelete.email || "Usuario eliminado",
            },
          });

          // Las salas SIEMPRE deben tener un creador, reasignar al admin actual
          await tx.sala.updateMany({
            where: { creadorId: id },
            data: {
              creadorId: adminUserId,
              descripcion: `[Sala de usuario eliminado: ${userToDelete.name || userToDelete.email}] ${userToDelete.salasPropias?.[0]?.descripcion || ""}`,
            },
          });
        }
      } else {
        // ESTRATEGIA 2: ELIMINACIÓN CASCADA
        // Eliminar todo el contenido del usuario

        // Primero eliminar relaciones que dependen de salas/murales
        await tx.salaMural.deleteMany({
          where: {
            sala: { creadorId: id },
          },
        });

        // Luego eliminar contenido propio
        await tx.mural.deleteMany({
          where: { userId: id },
        });

        await tx.sala.deleteMany({
          where: { creadorId: id },
        });
      }

      // Limpiar relaciones de colaboración (SIEMPRE se hace)
      await tx.salaColaborador.deleteMany({
        where: { userId: id },
      });

      await tx.muralColaborador.deleteMany({
        where: { userId: id },
      });

      await tx.userMuralFavorite.deleteMany({
        where: { userId: id },
      });

      // Limpiar datos de usuario
      await tx.artist.deleteMany({
        where: { userId: id },
      });

      await tx.pushSubscription.deleteMany({
        where: { userId: id },
      });

      await tx.subscription.deleteMany({
        where: { userId: id },
      });

      // Las cuentas y sesiones se eliminan automáticamente por onDelete: Cascade

      // FINALMENTE eliminar usuario (esto disparará las eliminaciones en cascada)
      await tx.user.delete({
        where: { id },
      });
    });

    // 7. LOG DE AUDITORÍA
    console.log(`[ADMIN DELETE] Usuario eliminado:`, {
      deletedUserId: id,
      deletedBy: session.user.id,
      deletedAt: new Date().toISOString(),
      strategy: preserveContent ? "preserve" : "cascade",
      reassigned: reassignToAdmin,
      impact,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuario eliminado exitosamente",
        impact,
        strategy: preserveContent
          ? "contenido preservado"
          : "eliminación completa",
        warnings: warnings.length > 0 ? warnings : undefined,
        forced: forceDelete && warnings.length > 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al eliminar usuario:", error);

    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/usuarios/[id]/delete - Análisis previo de eliminación
 * Retorna las implicaciones sin ejecutar la eliminación
 */
export async function GET(req, context) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const { id } = params;

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            salasPropias: true,
            salasColabora: true,
            Mural: true,
            muralesColabora: true,
            favoritedBy: true,
          },
        },
        artist: {
          select: {
            id: true,
            bio: true,
            especialidad: true,
          },
        },
        salasPropias: {
          select: {
            id: true,
            nombre: true,
            publica: true,
            _count: {
              select: {
                murales: true,
                colaboradores: true,
              },
            },
          },
        },
        Mural: {
          select: {
            id: true,
            titulo: true,
            publica: true,
          },
        },
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const analysis = {
      canDelete: session.user.id !== id,
      impact: {
        salasCreadas: user._count.salasPropias,
        salasColabora: user._count.salasColabora,
        muralesCreados: user._count.Mural,
        muralesColabora: user._count.muralesColabora,
        esArtista: user.artist !== null,
        tieneColeccionPersonal: user._count.favoritedBy > 0,
        salasPublicas: user.salasPropias.filter((s) => s.publica).length,
        muralesPublicos: user.Mural.filter((m) => m.publica).length,
      },
      warnings: [],
      recommendations: [],
    };

    // Generar advertencias
    if (analysis.impact.salasCreadas > 0) {
      analysis.warnings.push(
        `El usuario tiene ${analysis.impact.salasCreadas} salas creadas`
      );
    }

    if (analysis.impact.muralesCreados > 0) {
      analysis.warnings.push(
        `El usuario tiene ${analysis.impact.muralesCreados} murales creados`
      );
    }

    if (analysis.impact.salasPublicas > 0) {
      analysis.warnings.push(
        `${analysis.impact.salasPublicas} salas públicas se verán afectadas`
      );
    }

    // Generar recomendaciones
    if (
      analysis.impact.salasCreadas > 0 ||
      analysis.impact.muralesCreados > 0
    ) {
      analysis.recommendations.push(
        "Considere preservar el contenido en lugar de eliminarlo"
      );
      analysis.recommendations.push(
        "Reasigne el contenido a otro administrador"
      );
    }

    if (analysis.impact.esArtista) {
      analysis.recommendations.push(
        "El usuario tiene perfil de artista - considere conservar su trabajo"
      );
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en análisis de eliminación:", error);

    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}
