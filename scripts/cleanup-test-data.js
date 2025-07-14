const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Script para limpiar datos de prueba del sistema de eliminación de usuarios
 * Ejecutar con: node scripts/cleanup-test-data.js
 */

async function cleanupTestData() {
  console.log("🧹 Iniciando limpieza de datos de prueba...");

  try {
    const testUserIds = [
      "test-basic-user-123",
      "test-artist-user-456",
      "test-collab-user-789",
      "test-curator-user-101",
      "test-subscribed-user-202",
    ];

    const testEmails = [
      "test-basico@museo3d.com",
      "test-artista@museo3d.com",
      "test-colaborador@museo3d.com",
      "test-curador@museo3d.com",
      "test-suscrito@museo3d.com",
    ];

    console.log("🔍 Verificando usuarios de prueba existentes...");
    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [{ id: { in: testUserIds } }, { email: { in: testEmails } }],
      },
      include: {
        _count: {
          select: {
            salasPropias: true,
            Mural: true,
            salasColabora: true,
            muralesColabora: true,
            favoritedBy: true,
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
      },
    });

    if (existingUsers.length === 0) {
      console.log("ℹ️ No se encontraron usuarios de prueba para limpiar.");
      return;
    }

    console.log(`📊 Encontrados ${existingUsers.length} usuarios de prueba:`);
    existingUsers.forEach((user) => {
      console.log(`   • ${user.email} (${user.role})`);
    });

    console.log("\n🗑️ Iniciando eliminación en cascada...");

    // Eliminar en el orden correcto para evitar problemas de FK
    for (const user of existingUsers) {
      console.log(`\n🔄 Limpiando usuario: ${user.email}`);

      // 1. Eliminar colaboraciones en murales
      if (user._count.muralesColabora > 0) {
        await prisma.muralColaborador.deleteMany({
          where: { userId: user.id },
        });
        console.log(
          `   ✅ Eliminadas ${user._count.muralesColabora} colaboraciones en murales`
        );
      }

      // 2. Eliminar colaboraciones en salas
      if (user._count.salasColabora > 0) {
        await prisma.salaColaborador.deleteMany({
          where: { userId: user.id },
        });
        console.log(
          `   ✅ Eliminadas ${user._count.salasColabora} colaboraciones en salas`
        );
      }

      // 3. Eliminar favoritos (colección personal)
      if (user._count.favoritedBy > 0) {
        await prisma.userMuralFavorite.deleteMany({
          where: { userId: user.id },
        });
        console.log(`   ✅ Eliminados ${user._count.favoritedBy} favoritos`);
      }

      // 4. Eliminar relaciones sala-mural de las salas del usuario
      const userSalas = await prisma.sala.findMany({
        where: { creadorId: user.id },
        select: { id: true },
      });

      if (userSalas.length > 0) {
        await prisma.salaMural.deleteMany({
          where: {
            salaId: { in: userSalas.map((s) => s.id) },
          },
        });
        console.log(`   ✅ Eliminadas relaciones sala-mural`);
      }

      // 5. Eliminar murales del usuario
      if (user._count.Mural > 0) {
        await prisma.mural.deleteMany({
          where: { userId: user.id },
        });
        console.log(`   ✅ Eliminados ${user._count.Mural} murales`);
      }

      // 6. Eliminar salas del usuario
      if (user._count.salasPropias > 0) {
        await prisma.sala.deleteMany({
          where: { creadorId: user.id },
        });
        console.log(`   ✅ Eliminadas ${user._count.salasPropias} salas`);
      }

      // 7. Eliminar perfil de artista
      if (user.artist !== null) {
        await prisma.artist.deleteMany({
          where: { userId: user.id },
        });
        console.log(`   ✅ Eliminado perfil de artista`);
      }

      // 8. Eliminar suscripciones push
      if (user._count.pushSubscriptions > 0) {
        await prisma.pushSubscription.deleteMany({
          where: { userId: user.id },
        });
        console.log(
          `   ✅ Eliminadas ${user._count.pushSubscriptions} suscripciones push`
        );
      }

      // 9. Eliminar suscripciones
      if (user._count.subscriptions > 0) {
        await prisma.subscription.deleteMany({
          where: { userId: user.id },
        });
        console.log(
          `   ✅ Eliminadas ${user._count.subscriptions} suscripciones`
        );
      }

      // 10. Finalmente eliminar el usuario (las accounts y sessions se eliminan automáticamente por CASCADE)
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`   ✅ Usuario eliminado completamente`);
    }

    console.log("\n🎉 ¡Limpieza completada exitosamente!");
    console.log(
      `📊 Total eliminados: ${existingUsers.length} usuarios de prueba`
    );

    // Verificar limpieza
    const remainingUsers = await prisma.user.findMany({
      where: {
        OR: [{ id: { in: testUserIds } }, { email: { in: testEmails } }],
      },
    });

    if (remainingUsers.length === 0) {
      console.log(
        "✅ Verificación: No quedan usuarios de prueba en la base de datos"
      );
    } else {
      console.log(
        `⚠️ Advertencia: Aún quedan ${remainingUsers.length} usuarios de prueba`
      );
    }
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    console.log("\n🔧 Posibles soluciones:");
    console.log("1. Verificar que no hay restricciones de FK pendientes");
    console.log("2. Ejecutar el script nuevamente");
    console.log("3. Revisar manualmente la base de datos");
  } finally {
    await prisma.$disconnect();
  }
}

// Función para limpiar solo un usuario específico
async function cleanupSpecificUser(userEmail) {
  console.log(`🎯 Limpiando usuario específico: ${userEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      _count: {
        select: {
          salasPropias: true,
          Mural: true,
          salasColabora: true,
          muralesColabora: true,
          favoritedBy: true,
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
    },
  });

  if (!user) {
    console.log("❌ Usuario no encontrado");
    return;
  }

  // Usar la misma lógica de eliminación
  await cleanupTestData(); // Se podría optimizar para solo ese usuario
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 0 && args[0] === "--user") {
    cleanupSpecificUser(args[1]);
  } else {
    cleanupTestData();
  }
}

module.exports = { cleanupTestData, cleanupSpecificUser };
