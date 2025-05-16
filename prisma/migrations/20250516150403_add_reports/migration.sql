-- CreateTable
CREATE TABLE "Reports" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "formId" INTEGER NOT NULL,
    "reportUrl" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reports_reportUrl_key" ON "Reports"("reportUrl");

-- CreateIndex
CREATE INDEX "Reports_formId_idx" ON "Reports"("formId");

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
