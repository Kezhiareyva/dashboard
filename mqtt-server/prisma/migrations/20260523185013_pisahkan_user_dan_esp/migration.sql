/*
  Warnings:

  - You are about to drop the column `userId` on the `AltimeterData` table. All the data in the column will be lost.
  - Added the required column `espId` to the `AltimeterData` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AltimeterData" DROP CONSTRAINT "AltimeterData_userId_fkey";

-- AlterTable
ALTER TABLE "AltimeterData" DROP COLUMN "userId",
ADD COLUMN     "espId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "EspDevice" (
    "id" SERIAL NOT NULL,
    "identitas" TEXT NOT NULL,
    "namaAlat" TEXT NOT NULL,

    CONSTRAINT "EspDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EspDevice_identitas_key" ON "EspDevice"("identitas");

-- AddForeignKey
ALTER TABLE "AltimeterData" ADD CONSTRAINT "AltimeterData_espId_fkey" FOREIGN KEY ("espId") REFERENCES "EspDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
