-- CreateTable
CREATE TABLE "Aftercare" (
    "id" TEXT NOT NULL,
    "images" TEXT[],
    "description" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "Aftercare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Aftercare_bookingId_key" ON "Aftercare"("bookingId");

-- AddForeignKey
ALTER TABLE "Aftercare" ADD CONSTRAINT "Aftercare_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
