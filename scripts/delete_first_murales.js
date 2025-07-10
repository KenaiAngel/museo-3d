const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const ids = [1, 2, 3, 4, 5, 6];

  // Elimina relaciones en SalaMural
  await prisma.salaMural.deleteMany({
    where: { muralId: { in: ids } },
  });

  // Elimina los murales
  await prisma.mural.deleteMany({
    where: { id: { in: ids } },
  });

  console.log("Murales y relaciones eliminados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
