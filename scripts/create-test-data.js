const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Script para crear datos de prueba del sistema de eliminación de usuarios
 * Ejecutar con: node scripts/create-test-data.js
 */

// Función para limpiar datos de prueba existentes
async function cleanupExistingTestData() {
  const testUserIds = [
    "test-basic-user-123",
    "test-artist-user-456",
    "test-collab-user-789",
    "test-curator-user-101",
    "test-subscribed-user-202",
  ];

  try {
    // Limpiar en orden para evitar problemas de FK
    for (const userId of testUserIds) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        console.log(`   🗑️ Limpiando usuario existente: ${user.email}`);

        // Limpiar colaboraciones
        await prisma.muralColaborador.deleteMany({ where: { userId } });
        await prisma.salaColaborador.deleteMany({ where: { userId } });
        await prisma.userMuralFavorite.deleteMany({ where: { userId } });

        // Limpiar relaciones de salas
        const userSalas = await prisma.sala.findMany({
          where: { creadorId: userId },
          select: { id: true },
        });
        if (userSalas.length > 0) {
          await prisma.salaMural.deleteMany({
            where: { salaId: { in: userSalas.map((s) => s.id) } },
          });
        }

        // Limpiar contenido
        await prisma.mural.deleteMany({ where: { userId } });
        await prisma.sala.deleteMany({ where: { creadorId: userId } });

        // Limpiar datos de usuario
        await prisma.artist.deleteMany({ where: { userId } });
        await prisma.pushSubscription.deleteMany({ where: { userId } });
        await prisma.subscription.deleteMany({ where: { userId } });

        // Eliminar usuario
        await prisma.user.delete({ where: { id: userId } });
      }
    }
    console.log("✅ Limpieza completada");
  } catch (error) {
    console.log("⚠️ Advertencia durante limpieza:", error.message);
    // Continuar con la creación aunque falle la limpieza
  }
}

async function createTestData() {
  console.log(
    "🏗️ Iniciando creación de datos de prueba para eliminación de usuarios..."
  );

  try {
    // LIMPIAR DATOS EXISTENTES PRIMERO
    console.log("🧹 Limpiando datos de prueba existentes...");
    await cleanupExistingTestData();

    // 1. USUARIO BÁSICO SIN CONTENIDO
    console.log("📝 Creando usuario básico sin contenido...");
    const basicUser = await prisma.user.upsert({
      where: { email: "test-basico@museo3d.com" },
      update: {},
      create: {
        id: "test-basic-user-123",
        name: "Usuario Básico Test",
        email: "test-basico@museo3d.com",
        role: "USER",
        emailVerified: new Date(),
        settings: {},
      },
    });
    console.log("✅ Usuario básico creado:", basicUser.email);

    // 2. USUARIO ARTISTA CON CONTENIDO PÚBLICO
    console.log("🎨 Creando usuario artista con contenido público...");
    const artistUser = await prisma.user.upsert({
      where: { email: "test-artista@museo3d.com" },
      update: {},
      create: {
        id: "test-artist-user-456",
        name: "Artista Test González",
        email: "test-artista@museo3d.com",
        role: "ARTIST",
        emailVerified: new Date(),
        settings: {},
      },
    });

    // Crear perfil de artista
    await prisma.artist.upsert({
      where: { userId: artistUser.id },
      update: {},
      create: {
        userId: artistUser.id,
        bio: "Artista especializado en graffiti digital y murales urbanos. Participante activo en la comunidad.",
        especialidad: "Graffiti Digital",
        experiencia: "5 años",
        website: "https://artistatest.com",
        instagram: "@artistatest",
      },
    });

    // Crear sala pública del artista
    const artistSala = await prisma.sala.create({
      data: {
        nombre: "Galería Urbana Test",
        descripcion: "Colección de obras urbanas contemporáneas para testing",
        publica: true,
        creadorId: artistUser.id,
        color: "#FF6B6B",
        tema: "urbano",
      },
    });

    // Crear murales públicos
    const mural1 = await prisma.mural.create({
      data: {
        titulo: "Revolución Digital",
        descripcion:
          "Mural que representa la transformación digital en el arte urbano",
        anio: 2024,
        tecnica: "Spray digital",
        publica: true,
        userId: artistUser.id,
        ubicacion: "Calle Test 123",
        url_imagen: "https://example.com/mural1.jpg",
      },
    });

    const mural2 = await prisma.mural.create({
      data: {
        titulo: "Naturaleza Perdida",
        descripcion: "Reflexión sobre el medio ambiente urbano",
        anio: 2024,
        tecnica: "Mixta",
        publica: true,
        userId: artistUser.id,
        ubicacion: "Plaza Test",
        url_imagen: "https://example.com/mural2.jpg",
      },
    });

    // Agregar murales a la sala
    await prisma.salaMural.createMany({
      data: [
        { salaId: artistSala.id, muralId: mural1.id },
        { salaId: artistSala.id, muralId: mural2.id },
      ],
    });

    console.log("✅ Usuario artista creado con 1 sala y 2 murales públicos");

    // 3. USUARIO COLABORADOR ACTIVO
    console.log("👥 Creando usuario colaborador activo...");
    const collabUser = await prisma.user.upsert({
      where: { email: "test-colaborador@museo3d.com" },
      update: {},
      create: {
        id: "test-collab-user-789",
        name: "Colaborador Test López",
        email: "test-colaborador@museo3d.com",
        role: "USER",
        emailVerified: new Date(),
        settings: {},
      },
    });

    // Crear sala propia del colaborador
    const collabSala = await prisma.sala.create({
      data: {
        nombre: "Espacio Colaborativo Test",
        descripcion: "Sala para pruebas de colaboración",
        publica: false,
        creadorId: collabUser.id,
      },
    });

    // Agregar como colaborador en la sala del artista (evitar duplicados)
    try {
      await prisma.salaColaborador.create({
        data: {
          salaId: artistSala.id,
          userId: collabUser.id,
          rol: "curador",
        },
      });
    } catch (error) {
      if (error.code === "P2002") {
        console.log("   ⚠️ Colaboración en sala ya existe, continuando...");
      } else {
        throw error;
      }
    }

    // Agregar como colaborador en murales (evitar duplicados)
    try {
      await prisma.muralColaborador.create({
        data: {
          muralId: mural1.id,
          userId: collabUser.id,
          rol: "colaborador",
        },
      });
    } catch (error) {
      if (error.code === "P2002") {
        console.log("   ⚠️ Colaboración en mural 1 ya existe, continuando...");
      } else {
        throw error;
      }
    }

    try {
      await prisma.muralColaborador.create({
        data: {
          muralId: mural2.id,
          userId: collabUser.id,
          rol: "documentalista",
        },
      });
    } catch (error) {
      if (error.code === "P2002") {
        console.log("   ⚠️ Colaboración en mural 2 ya existe, continuando...");
      } else {
        throw error;
      }
    }

    console.log(
      "✅ Usuario colaborador creado con 1 sala propia y colaboraciones"
    );

    // 4. USUARIO CURADOR CON COLECCIÓN PERSONAL
    console.log("🏛️ Creando usuario curador con colección...");
    const curatorUser = await prisma.user.upsert({
      where: { email: "test-curador@museo3d.com" },
      update: {},
      create: {
        id: "test-curator-user-101",
        name: "Curador Test Martínez",
        email: "test-curador@museo3d.com",
        role: "CURATOR",
        emailVerified: new Date(),
        settings: {},
      },
    });

    // Agregar murales a favoritos (colección personal) - evitar duplicados
    try {
      await prisma.userMuralFavorite.create({
        data: { userId: curatorUser.id, muralId: mural1.id },
      });
    } catch (error) {
      if (error.code === "P2002") {
        console.log("   ⚠️ Favorito mural 1 ya existe, continuando...");
      } else {
        throw error;
      }
    }

    try {
      await prisma.userMuralFavorite.create({
        data: { userId: curatorUser.id, muralId: mural2.id },
      });
    } catch (error) {
      if (error.code === "P2002") {
        console.log("   ⚠️ Favorito mural 2 ya existe, continuando...");
      } else {
        throw error;
      }
    }

    console.log("✅ Usuario curador creado con colección personal");

    // 5. USUARIO CON SUSCRIPCIONES Y NOTIFICACIONES
    console.log("🔔 Creando usuario con suscripciones...");
    const subscribedUser = await prisma.user.upsert({
      where: { email: "test-suscrito@museo3d.com" },
      update: {},
      create: {
        id: "test-subscribed-user-202",
        name: "Usuario Suscrito Test",
        email: "test-suscrito@museo3d.com",
        role: "USER",
        emailVerified: new Date(),
        settings: {},
      },
    });

    // Crear suscripciones (usar upsert para evitar duplicados)
    await prisma.subscription.upsert({
      where: { userId_type: { userId: subscribedUser.id, type: "sala" } },
      update: {},
      create: { userId: subscribedUser.id, type: "sala" },
    });

    await prisma.subscription.upsert({
      where: { userId_type: { userId: subscribedUser.id, type: "obra" } },
      update: {},
      create: { userId: subscribedUser.id, type: "obra" },
    });

    // Crear suscripción push (simulada) - usar upsert
    await prisma.pushSubscription.upsert({
      where: { endpoint: "https://test-push-endpoint.com/test" },
      update: { userId: subscribedUser.id },
      create: {
        endpoint: "https://test-push-endpoint.com/test",
        p256dh: "test-p256dh-key",
        auth: "test-auth-key",
        userId: subscribedUser.id,
      },
    });

    console.log("✅ Usuario con suscripciones creado");

    // RESUMEN FINAL
    console.log("\n🎉 ¡Datos de prueba creados exitosamente!");
    console.log("\n📊 Resumen de usuarios de prueba:");
    console.log(
      "┌─────────────────────────────────────────────────────────────┐"
    );
    console.log(
      "│ TIPO                │ EMAIL                     │ ID          │"
    );
    console.log(
      "├─────────────────────────────────────────────────────────────┤"
    );
    console.log(
      "│ Básico              │ test-basico@museo3d.com   │ test-basic-user-123   │"
    );
    console.log(
      "│ Artista (público)   │ test-artista@museo3d.com  │ test-artist-user-456  │"
    );
    console.log(
      "│ Colaborador         │ test-colaborador@museo3d.com │ test-collab-user-789 │"
    );
    console.log(
      "│ Curador             │ test-curador@museo3d.com  │ test-curator-user-101 │"
    );
    console.log(
      "│ Con suscripciones   │ test-suscrito@museo3d.com │ test-subscribed-user-202 │"
    );
    console.log(
      "└─────────────────────────────────────────────────────────────┘"
    );

    console.log("\n🧪 Casos de prueba disponibles:");
    console.log("1. Eliminación básica sin impacto");
    console.log("2. Eliminación de artista con contenido público");
    console.log("3. Eliminación de colaborador activo");
    console.log("4. Eliminación de curador con colección");
    console.log("5. Eliminación con suscripciones activas");

    console.log("\n📝 Para probar:");
    console.log("1. Abrir /admin/usuarios");
    console.log("2. Buscar cualquiera de los emails de arriba");
    console.log('3. Hacer clic en "Eliminar"');
    console.log("4. Observar diferentes análisis de impacto");

    console.log("\n🧹 Para limpiar: node scripts/cleanup-test-data.js");
  } catch (error) {
    console.error("❌ Error creando datos de prueba:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData };
