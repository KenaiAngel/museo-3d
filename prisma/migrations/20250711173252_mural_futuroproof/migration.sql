-- DropIndex
DROP INDEX "Mural_titulo_key";

-- AlterTable
ALTER TABLE "Mural" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "destacada" BOOLEAN DEFAULT false,
ADD COLUMN     "dimensiones" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "exposiciones" JSONB,
ADD COLUMN     "imagenUrlWebp" TEXT,
ADD COLUMN     "imagenesSecundarias" JSONB,
ADD COLUMN     "orden" INTEGER,
ADD COLUMN     "publica" BOOLEAN DEFAULT true,
ADD COLUMN     "salaId" INTEGER,
ADD COLUMN     "tags" JSONB,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "visitas" INTEGER DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Mural" ADD CONSTRAINT "Mural_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
