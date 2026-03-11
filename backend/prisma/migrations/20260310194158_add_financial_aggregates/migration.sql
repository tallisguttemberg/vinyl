-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "totalFinishingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalMaterialCost" DECIMAL(10,2) NOT NULL DEFAULT 0;
