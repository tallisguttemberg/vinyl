import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting script...");
    const orgs = await prisma.user.findMany({ select: { organizationId: true } });
    console.log('Orgs found:', [...new Set(orgs.map(o => o.organizationId))]);

    const materials = await prisma.material.findMany();
    console.log('Total Materials:', materials.length);
    materials.forEach(m => console.log(`- ${m.name} (Org: ${m.organizationId})`));

    const supplies = await prisma.supply.findMany();
    console.log('Total Supplies:', supplies.length);
    supplies.forEach(s => console.log(`- ${s.name} (Org: ${s.organizationId})`));

    const equipment = await prisma.equipment.findMany();
    console.log('Total Equipment:', equipment.length);
    equipment.forEach(e => console.log(`- ${e.name} (Org: ${e.organizationId})`));

    const orders = await prisma.order.findMany({ 
        include: { items: true, supplies: true, equipments: true } 
    });
    console.log('Total Orders:', orders.length);
    orders.slice(0, 5).forEach(o => {
        console.log(`Order ${o.id}: Items=${o.items.length} Supplies=${o.supplies.length} Equipments=${o.equipments.length}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
