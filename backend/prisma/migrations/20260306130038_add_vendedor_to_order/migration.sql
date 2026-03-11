-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "vendedorId" TEXT;

-- CreateIndex
CREATE INDEX "Order_vendedorId_idx" ON "Order"("vendedorId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
