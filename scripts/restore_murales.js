const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const backupPath = path.join(__dirname, "../public/murales_backup.json");
  if (!fs.existsSync(backupPath)) {
    console.error("No se encontró el archivo de respaldo:", backupPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
  const murales = data.murales || [];
  let insertados = 0;
  let duplicados = 0;

  for (const mural of murales) {
    try {
      // Evitar duplicados por título
      const existente = await prisma.mural.findUnique({
        where: { titulo: mural.titulo },
      });
      if (existente) {
        duplicados++;
        continue;
      }
      await prisma.mural.create({
        data: {
          titulo: mural.titulo,
          autor: mural.autor || null,
          tecnica: mural.tecnica || null,
          descripcion: mural.descripcion || null,
          anio: mural.anio || null,
          url_imagen: mural.url_imagen || null,
          latitud: mural.latitud || null,
          longitud: mural.longitud || null,
          ubicacion: mural.ubicacion || null,
          // Puedes mapear metadata si tienes campos adicionales en el modelo
        },
      });
      insertados++;
    } catch (err) {
      console.error("Error insertando mural", mural.titulo, err.message);
    }
  }

  console.log(`Murales insertados: ${insertados}`);
  console.log(`Murales duplicados (omitidos): ${duplicados}`);
  await prisma.$disconnect();
}

main();
