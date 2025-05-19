-- CreateTable
CREATE TABLE "TattooDesign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "size" TEXT,
    "style" TEXT NOT NULL,
    "categories" TEXT[],
    "artistId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TattooDesign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TattooDesign" ADD CONSTRAINT "TattooDesign_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
