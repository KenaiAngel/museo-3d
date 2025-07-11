const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Leer el archivo murales_backup.json
  const muralesBackupPath = path.join(
    __dirname,
    "..",
    "public",
    "murales_backup.json"
  );
  const muralesData = JSON.parse(fs.readFileSync(muralesBackupPath, "utf8"));

  console.log(`📄 Loaded ${muralesData.murales.length} murales from backup`);

  // Crear usuarios base
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@museo3d.com" },
    update: {},
    create: {
      email: "admin@museo3d.com",
      name: "Administrador",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: "test@museo3d.com" },
    update: {},
    create: {
      email: "test@museo3d.com",
      name: "Usuario de Prueba",
      role: "USER",
      emailVerified: new Date(),
    },
  });

  const artistUser = await prisma.user.upsert({
    where: { email: "artista@museo3d.com" },
    update: {},
    create: {
      email: "artista@museo3d.com",
      name: "Artista de Prueba",
      role: "ARTIST",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Base users created");

  // Crear perfil de artista
  await prisma.artist.upsert({
    where: { userId: artistUser.id },
    update: {},
    create: {
      userId: artistUser.id,
      bio: "Artista especializado en murales",
      especialidad: "Muralismo",
    },
  });

  // Procesar cada mural del backup
  for (const muralData of muralesData.murales) {
    try {
      // Procesar autores (separados por comas)
      const autores = muralData.autor
        ? muralData.autor
            .split(",")
            .map((autor) => autor.trim())
            .filter(Boolean)
        : [];

      // El autor principal es el primero de la lista
      const autorPrincipal =
        autores.length > 0 ? autores[0] : "Autor desconocido";

      // Crear el mural
      const mural = await prisma.mural.create({
        data: {
          titulo: muralData.titulo,
          autor: autorPrincipal,
          tecnica: muralData.tecnica,
          descripcion: muralData.descripcion,
          anio: muralData.anio,
          ubicacion: muralData.ubicacion,
          url_imagen: muralData.url_imagen,
          latitud: muralData.latitud,
          longitud: muralData.longitud,
          userId: adminUser.id, // Asignar al admin como propietario por defecto
          publica: true,
          destacada: false,
        },
      });

      // Procesar colaboradores de metadata
      if (muralData.metadata?.colaboradores) {
        const colaboradores = muralData.metadata.colaboradores
          .split(",")
          .map((colab) => colab.trim())
          .filter(Boolean);

        // Crear registros de colaboradores
        for (const colaborador of colaboradores) {
          await prisma.muralColaborador.create({
            data: {
              muralId: mural.id,
              nombreExterno: colaborador,
              rol: "colaborador",
            },
          });
        }
      }

      // Si hay múltiples autores, agregar los demás como colaboradores
      if (autores.length > 1) {
        for (let i = 1; i < autores.length; i++) {
          await prisma.muralColaborador.create({
            data: {
              muralId: mural.id,
              nombreExterno: autores[i],
              rol: "coautor",
            },
          });
        }
      }

      console.log(`✅ Created mural: ${mural.titulo}`);
    } catch (error) {
      console.error(
        `❌ Error creating mural "${muralData.titulo}":`,
        error.message
      );
    }
  }

  // Asignar todos los murales al usuario admin
  const allMurales = await prisma.mural.findMany();

  await prisma.mural.updateMany({
    where: {},
    data: {
      userId: adminUser.id,
    },
  });

  console.log(`✅ Assigned ${allMurales.length} murales to admin user`);

  // Crear tres salas principales
  if (allMurales.length > 0) {
    // Sala 1: Colección ARPA
    const sala1 = await prisma.sala.create({
      data: {
        nombre: "Colección ARPA",
        descripcion:
          "Murales del proyecto ARPA de la BUAP - Arte urbano y muralismo contemporáneo",
        publica: true,
        creadorId: adminUser.id,
        color: "#3B82F6",
        texturaPared: "brick",
        texturaPiso: "wood",
      },
    });

    // Sala 2: Arte Urbano Mexicano
    const sala2 = await prisma.sala.create({
      data: {
        nombre: "Arte Urbano Mexicano",
        descripcion: "Expresiones del muralismo moderno en espacios urbanos",
        publica: true,
        creadorId: adminUser.id,
        color: "#10B981",
        texturaPared: "concrete",
        texturaPiso: "marble",
      },
    });

    // Sala 3: Murales Destacados
    const sala3 = await prisma.sala.create({
      data: {
        nombre: "Murales Destacados",
        descripcion: "Selección especial de las obras más representativas",
        publica: true,
        creadorId: adminUser.id,
        color: "#F59E0B",
        texturaPared: "stone",
        texturaPiso: "parquet",
      },
    });

    // Distribuir murales entre las salas
    const tercio = Math.ceil(allMurales.length / 3);

    // Sala 1: Primeros murales
    const muralesSala1 = allMurales.slice(0, tercio);
    for (const mural of muralesSala1) {
      await prisma.salaMural.create({
        data: {
          salaId: sala1.id,
          muralId: mural.id,
        },
      });
    }

    // Sala 2: Segundo tercio
    const muralesSala2 = allMurales.slice(tercio, tercio * 2);
    for (const mural of muralesSala2) {
      await prisma.salaMural.create({
        data: {
          salaId: sala2.id,
          muralId: mural.id,
        },
      });
    }

    // Sala 3: Último tercio
    const muralesSala3 = allMurales.slice(tercio * 2);
    for (const mural of muralesSala3) {
      await prisma.salaMural.create({
        data: {
          salaId: sala3.id,
          muralId: mural.id,
        },
      });
    }

    console.log(`✅ Created 3 rooms:`);
    console.log(`   • ${sala1.nombre}: ${muralesSala1.length} murales`);
    console.log(`   • ${sala2.nombre}: ${muralesSala2.length} murales`);
    console.log(`   • ${sala3.nombre}: ${muralesSala3.length} murales`);
  }

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
