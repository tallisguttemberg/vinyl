-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('ADHESIVE', 'LIQUID');

-- CreateEnum
CREATE TYPE "MaterialUnit" AS ENUM ('M2', 'ML');

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "category" "MaterialCategory" NOT NULL DEFAULT 'ADHESIVE',
ADD COLUMN     "costPerMl" DECIMAL(10,2),
ADD COLUMN     "unit" "MaterialUnit" NOT NULL DEFAULT 'M2',
ADD COLUMN     "volume" DECIMAL(10,2),
ALTER COLUMN "rollLength" DROP NOT NULL,
ALTER COLUMN "width" DROP NOT NULL,
ALTER COLUMN "costPerLinearMeter" DROP NOT NULL,
ALTER COLUMN "costPerSqMeter" DROP NOT NULL;
