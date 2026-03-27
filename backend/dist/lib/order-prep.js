"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareOrderCalculationItems = prepareOrderCalculationItems;
const server_1 = require("@trpc/server");
async function prepareOrderCalculationItems(prisma, orgId, items) {
    const materials = await prisma.material.findMany({
        where: {
            id: { in: items.map(i => i.materialId).filter((id) => !!id) },
            organizationId: orgId,
        }
    });
    const serviceTypes = await prisma.serviceType.findMany({
        where: {
            id: { in: items.map(i => i.serviceTypeId) },
            organizationId: orgId,
        }
    });
    const calcItems = items.map(item => {
        const material = materials.find(m => m.id === item.materialId);
        const serviceType = serviceTypes.find(st => st.id === item.serviceTypeId);
        if (!serviceType) {
            throw new server_1.TRPCError({
                code: "BAD_REQUEST",
                message: `Tipo de Serviço ${item.serviceTypeId} não encontrado.`
            });
        }
        return {
            width: item.width,
            height: item.height,
            mlUsed: item.mlUsed,
            quantity: item.quantity,
            billingType: (serviceType.billingType || 'FIXED'),
            unitPrice: item.unitPrice,
            wastePercentage: item.wastePercentage || Number(serviceType.wastePercentage || 0),
            operationalCostPerM2: Number(serviceType.operationalCostPerM2 || 0),
            materialStop: material ? {
                costPerSqMeter: Number(material.costPerSqMeter),
                costPerMl: Number(material.costPerMl)
            } : undefined,
            finishings: item.finishings,
        };
    });
    return calcItems;
}
