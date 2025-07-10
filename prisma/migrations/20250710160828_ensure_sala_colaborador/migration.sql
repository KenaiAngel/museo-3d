/*
  Warnings:

  - You are about to drop the `_SalaColaboradores` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_SalaColaboradores" DROP CONSTRAINT "_SalaColaboradores_A_fkey";

-- DropForeignKey
ALTER TABLE "_SalaColaboradores" DROP CONSTRAINT "_SalaColaboradores_B_fkey";

-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "keys" JSONB,
ALTER COLUMN "userId" DROP NOT NULL;

-- DropTable
DROP TABLE "_SalaColaboradores";

-- CreateTable
CREATE TABLE "SalaColaborador" (
    "id" SERIAL NOT NULL,
    "salaId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaColaborador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaColaborador_salaId_userId_key" ON "SalaColaborador"("salaId", "userId");

-- AddForeignKey
ALTER TABLE "SalaColaborador" ADD CONSTRAINT "SalaColaborador_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaColaborador" ADD CONSTRAINT "SalaColaborador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
