import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fixing null supplierIds...");
    
    // First find any existing supplier or create a default one
    let defaultSupplier = await prisma.supplier.findFirst();
    if (!defaultSupplier) {
        defaultSupplier = await prisma.supplier.create({
            data: {
                name: "Fornecedor Padrão (Migrado)",
                organizationId: "default"
            }
        });
        console.log("Created default supplier", defaultSupplier.id);
    } else {
        console.log("Found existing supplier", defaultSupplier.id);
    }

    // Use raw query to step around the Prisma schema constraint 
    // Since prisma schema expects String, Prisma client model updates might fail if they read the null first.
    // Raw SQL is safest here.
    
    const matResult = await prisma.$executeRaw`UPDATE "Material" SET "supplierId" = ${defaultSupplier.id} WHERE "supplierId" IS NULL`;
    console.log("Updated Materials:", matResult);

    const supResult = await prisma.$executeRaw`UPDATE "Supply" SET "supplierId" = ${defaultSupplier.id} WHERE "supplierId" IS NULL`;
    console.log("Updated Supplies:", supResult);

    const eqResult = await prisma.$executeRaw`UPDATE "Equipment" SET "supplierId" = ${defaultSupplier.id} WHERE "supplierId" IS NULL`;
    console.log("Updated Equipments:", eqResult);

    console.log("Migration complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
