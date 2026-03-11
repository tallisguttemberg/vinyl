-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "hasVarnish" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mlUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "varnishMl" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ServiceType" ADD COLUMN     "varnishPricePerMl" DECIMAL(10,2);
