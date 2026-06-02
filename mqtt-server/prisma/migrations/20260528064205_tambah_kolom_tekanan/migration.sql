/*
  Warnings:

  - Added the required column `tekanan` to the `AltimeterData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AltimeterData" ADD COLUMN     "tekanan" DOUBLE PRECISION NOT NULL;
