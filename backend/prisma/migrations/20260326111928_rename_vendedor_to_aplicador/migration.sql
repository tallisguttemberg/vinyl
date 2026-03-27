/*
  Warnings:

  - You are about to drop the column `commissionRate` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalCommission` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `vendedorId` on the `Order` table. All the data in the column will be lost.
  - The `discountType` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `commissionBase` on the `OrganizationSettings` table. All the data in the column will be lost.
  - Added the required column `supplierId` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `MaterialEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalServiceCommission` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYABLE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_vendedorId_fkey";

-- DropIndex
DROP INDEX "Order_vendedorId_idx";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "targetId" TEXT;

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "supplierId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MaterialEntry" ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "commissionRate",
DROP COLUMN "totalCommission",
DROP COLUMN "vendedorId",
ADD COLUMN     "aplicadorId" TEXT,
ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "serviceCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalEquipmentCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalServiceCommission" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "totalSupplyCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
DROP COLUMN "discountType",
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE';

-- AlterTable
ALTER TABLE "OrganizationSettings" DROP COLUMN "commissionBase",
ADD COLUMN     "logoDarkUrl" TEXT,
ADD COLUMN     "serviceCommissionBase" TEXT NOT NULL DEFAULT 'GROSS_REVENUE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "consumptionPerM2" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supplierId" TEXT NOT NULL,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dailyCost" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supplierId" TEXT NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSupply" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEquipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "dailyCost" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" DATE NOT NULL,
    "paymentDate" DATE,
    "paymentMethod" TEXT,
    "category" TEXT,
    "orderId" TEXT,
    "entityName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");

-- CreateIndex
CREATE INDEX "Supply_organizationId_idx" ON "Supply"("organizationId");

-- CreateIndex
CREATE INDEX "Supply_supplierId_idx" ON "Supply"("supplierId");

-- CreateIndex
CREATE INDEX "Equipment_organizationId_idx" ON "Equipment"("organizationId");

-- CreateIndex
CREATE INDEX "Equipment_supplierId_idx" ON "Equipment"("supplierId");

-- CreateIndex
CREATE INDEX "OrderSupply_orderId_idx" ON "OrderSupply"("orderId");

-- CreateIndex
CREATE INDEX "OrderSupply_supplyId_idx" ON "OrderSupply"("supplyId");

-- CreateIndex
CREATE INDEX "OrderEquipment_orderId_idx" ON "OrderEquipment"("orderId");

-- CreateIndex
CREATE INDEX "OrderEquipment_equipmentId_idx" ON "OrderEquipment"("equipmentId");

-- CreateIndex
CREATE INDEX "OrderLog_orderId_idx" ON "OrderLog"("orderId");

-- CreateIndex
CREATE INDEX "OrderLog_userId_idx" ON "OrderLog"("userId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_organizationId_idx" ON "FinancialTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_orderId_idx" ON "FinancialTransaction"("orderId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_idUsuarioResponsavel_idx" ON "AuditLog"("idUsuarioResponsavel");

-- CreateIndex
CREATE INDEX "Material_supplierId_idx" ON "Material"("supplierId");

-- CreateIndex
CREATE INDEX "MaterialEntry_organizationId_idx" ON "MaterialEntry"("organizationId");

-- CreateIndex
CREATE INDEX "MaterialEntry_materialId_idx" ON "MaterialEntry"("materialId");

-- CreateIndex
CREATE INDEX "MaterialEntry_supplierId_idx" ON "MaterialEntry"("supplierId");

-- CreateIndex
CREATE INDEX "Order_aplicadorId_idx" ON "Order"("aplicadorId");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialEntry" ADD CONSTRAINT "MaterialEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_aplicadorId_fkey" FOREIGN KEY ("aplicadorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supply" ADD CONSTRAINT "Supply_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSupply" ADD CONSTRAINT "OrderSupply_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSupply" ADD CONSTRAINT "OrderSupply_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEquipment" ADD CONSTRAINT "OrderEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEquipment" ADD CONSTRAINT "OrderEquipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLog" ADD CONSTRAINT "OrderLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLog" ADD CONSTRAINT "OrderLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
