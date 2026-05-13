-- CreateTable
CREATE TABLE "AltimeterData" (
    "id" SERIAL NOT NULL,
    "ketinggian" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AltimeterData_pkey" PRIMARY KEY ("id")
);
