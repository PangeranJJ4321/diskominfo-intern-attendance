-- CreateTable
CREATE TABLE "location_log" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_log_internId_idx" ON "location_log"("internId");

-- CreateIndex
CREATE INDEX "location_log_createdAt_idx" ON "location_log"("createdAt");

-- AddForeignKey
ALTER TABLE "location_log" ADD CONSTRAINT "location_log_internId_fkey"
    FOREIGN KEY ("internId") REFERENCES "intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
