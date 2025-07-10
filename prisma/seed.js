const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // --- 1. CREACIÓN DE USUARIOS ---
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
  console.log("✅ Admin user processed:", adminUser.email);

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
  console.log("✅ Test user processed:", testUser.email);

  const artistUser = await prisma.user.upsert({
    where: { email: "artista@museo3d.com" },
    update: {},
    create: {
      email: "artista@museo3d.com",
      name: "Artista de Prueba",
      role: "ARTIST",
      emailVerified: new Date(),
      artist: {
        create: {
          bio: "Artista apasionado por el muralismo y el arte urbano.",
          especialidad: "Muralismo, Arte Digital",
        },
      },
    },
    include: { artist: true },
  });
  console.log("✅ Artist user processed:", artistUser.email);

  // --- 2. CREACIÓN DE MURALES DE EJEMPLO ---
  // const muralesData = [
  //   {
  //     titulo: "Mural de Bienvenida",
  //     autor: "Artista Local",
  //     tecnica: "Acrílico sobre muro",
  //     descripcion: "Un mural vibrante que da la bienvenida a los visitantes.",
  //     anio: 2024,
  //     url_imagen:
  //       "https://res.cloudinary.com/daol1ohso/image/upload/v1749847137/ejemplo1.jpg",
  //   },
  //   {
  //     titulo: "Historia de la Ciudad",
  //     autor: "Muralista Urbano",
  //     tecnica: "Spray y acrílico",
  //     descripcion:
  //       "Un recorrido visual por la rica historia de nuestra ciudad.",
  //     anio: 2023,
  //     url_imagen:
  //       "https://res.cloudinary.com/daol1ohso/image/upload/v1749847137/ejemplo2.jpg",
  //   },
  //   {
  //     titulo: "Sueños Digitales",
  //     autor: "Artista de Prueba",
  //     tecnica: "Proyección sobre muro",
  //     descripcion:
  //       "Una exploración de los paisajes oníricos en la era digital.",
  //     anio: 2024,
  //     url_imagen:
  //       "https://res.cloudinary.com/daol1ohso/image/upload/v1749847137/mural_artista1.jpg",
  //     artistId: artistUser.artist.id,
  //   },
  //   {
  //     titulo: "Naturaleza Conectada",
  //     autor: "Artista de Prueba",
  //     tecnica: "Pintura con elementos de AR",
  //     descripcion: "Un mural que cobra vida a través de la realidad aumentada.",
  //     anio: 2023,
  //     url_imagen:
  //       "https://res.cloudinary.com/daol1ohso/image/upload/v1749847137/mural_artista2.jpg",
  //     artistId: artistUser.artist.id,
  //   },
  //   {
  //     titulo: "Geometría Ancestral",
  //     autor: "Colectivo Andino",
  //     tecnica: "Mosaico de cerámica",
  //     descripcion: "Patrones geométricos inspirados en culturas precolombinas.",
  //     anio: 2022,
  //     url_imagen:
  //       "https://res.cloudinary.com/daol1ohso/image/upload/v1749847137/mural_geo.jpg",
  //   },
  //   {
  //     titulo: "Ritmos Urbanos",
  //     autor: "DJ Arte",
  //     tecnica: "Grafiti y esténcil",
  //     descripcion:
  //       "La energía y el movimiento de la música urbana plasmados en un muro.",
  //     anio: 2024,
  //     url_imagen:
  //       "https://res.cloudinary.com/daol1ohso/image/upload/v1749847137/mural_urbano.jpg",
  //   },
  // ];

  // for (const data of muralesData) {
  //   const existingMural = await prisma.mural.findFirst({
  //     where: { titulo: data.titulo },
  //   });
  //   if (!existingMural) {
  //     await prisma.mural.create({ data });
  //   }
  // }
  // console.log(`✅ ${muralesData.length} base murals processed.`);

  // --- 3. LIMPIAR ASOCIACIONES Y SALAS EXISTENTES ---
  // Para evitar duplicados en relaciones, es más seguro limpiar las salas viejas
  await prisma.salaMural.deleteMany({});
  await prisma.sala.deleteMany({});
  console.log("🧹 Old rooms and associations cleared.");

  // --- 4. OBTENER TODOS LOS MURALES Y REPARTIRLOS ---
  const allMurales = await prisma.mural.findMany();
  const totalMurales = allMurales.length;
  const muralesPerSala = Math.floor(totalMurales / 3);

  const muralesSala1 = allMurales.slice(0, muralesPerSala);
  const muralesSala2 = allMurales.slice(muralesPerSala, muralesPerSala * 2);
  const muralesSala3 = allMurales.slice(muralesPerSala * 2);

  // --- 5. CREAR LAS 3 SALAS Y ASIGNAR MURALES ---
  const createSalaWithMurales = async (nombre, creador, murales) => {
    if (murales.length === 0) {
      console.log(
        `⚠️ No murals to assign to room "${nombre}". Skipping creation.`
      );
      return null;
    }
    const sala = await prisma.sala.create({
      data: {
        nombre,
        descripcion: `Sala gestionada por ${creador.name}.`,
        publica: true,
        creadorId: creador.id,
        murales: {
          create: murales.map((mural) => ({
            muralId: mural.id,
          })),
        },
      },
    });
    console.log(
      `✅ Room "${sala.nombre}" created with ${murales.length} murals.`
    );
    return sala;
  };

  await createSalaWithMurales(
    "Colección del Administrador",
    adminUser,
    muralesSala1
  );
  await createSalaWithMurales(
    "Exhibición del Artista",
    artistUser,
    muralesSala2
  );
  await createSalaWithMurales("Favoritos del Usuario", testUser, muralesSala3);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
