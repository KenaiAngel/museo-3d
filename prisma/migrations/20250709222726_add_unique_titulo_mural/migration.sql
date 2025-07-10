/*
  Warnings:

  - A unique constraint covering the columns `[titulo]` on the table `Mural` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Mural_titulo_key" ON "Mural"("titulo");
