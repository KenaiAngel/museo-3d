-- CreateTable
CREATE TABLE "MuralColaborador" (
    "id" SERIAL NOT NULL,
    "muralId" INTEGER NOT NULL,
    "userId" TEXT,
    "nombreExterno" TEXT,
    "rol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuralColaborador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuralColaborador_muralId_userId_nombreExterno_key" ON "MuralColaborador"("muralId", "userId", "nombreExterno");

-- AddForeignKey
ALTER TABLE "MuralColaborador" ADD CONSTRAINT "MuralColaborador_muralId_fkey" FOREIGN KEY ("muralId") REFERENCES "Mural"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuralColaborador" ADD CONSTRAINT "MuralColaborador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
