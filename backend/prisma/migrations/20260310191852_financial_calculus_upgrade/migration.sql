/*
  Warnings:

  - You are about to drop the column `wastePercentage` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `hasVarnish` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `varnishMl` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `varnishPricePerMl` on the `ServiceType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "wastePercentage",
ADD COLUMN     "totalOperationalCost" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "hasVarnish",
DROP COLUMN "varnishMl",
ADD COLUMN     "operationalCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "wastePercentage" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrganizationSettings" ADD COLUMN     "commissionBase" TEXT NOT NULL DEFAULT 'GROSS_REVENUE',
ADD COLUMN     "minimumMarginAllowed" DECIMAL(5,2) NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "ServiceType" DROP COLUMN "varnishPricePerMl",
ADD COLUMN     "operationalCostPerM2" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "wastePercentage" DECIMAL(5,2) DEFAULT 0;

-- CreateTable
CREATE TABLE "OrderItemFinishing" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "OrderItemFinishing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderItemFinishing_orderItemId_idx" ON "OrderItemFinishing"("orderItemId");

-- AddForeignKey
ALTER TABLE "OrderItemFinishing" ADD CONSTRAINT "OrderItemFinishing_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
