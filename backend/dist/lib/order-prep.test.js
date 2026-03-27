"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const order_prep_1 = require("./order-prep");
(0, vitest_1.describe)('prepareOrderCalculationItems', () => {
    (0, vitest_1.it)('should correctly map raw items to calculation items by fetching from db', async () => {
        // 1. Mock Prisma
        const mockPrisma = {
            material: {
                findMany: vitest_1.vi.fn().mockResolvedValue([
                    { id: 'mat1', costPerSqMeter: 10, costPerMl: 0 }
                ])
            },
            serviceType: {
                findMany: vitest_1.vi.fn().mockResolvedValue([
                    { id: 'svc1', billingType: 'PER_M2', wastePercentage: 5, operationalCostPerM2: 2 }
                ])
            }
        };
        const input = [{
                serviceTypeId: 'svc1',
                materialId: 'mat1',
                width: 1,
                height: 1,
                quantity: 1,
                unitPrice: 50,
                wastePercentage: 0,
                finishings: []
            }];
        // 2. Execute
        const result = await (0, order_prep_1.prepareOrderCalculationItems)(mockPrisma, 'org1', input);
        // 3. Assert
        (0, vitest_1.expect)(result).toHaveLength(1);
        (0, vitest_1.expect)(result[0].billingType).toBe('PER_M2');
        (0, vitest_1.expect)(result[0].wastePercentage).toBe(5); // Came from serviceType
        (0, vitest_1.expect)(result[0].materialStop?.costPerSqMeter).toBe(10);
        (0, vitest_1.expect)(mockPrisma.material.findMany).toHaveBeenCalled();
        (0, vitest_1.expect)(mockPrisma.serviceType.findMany).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should throw error if service type is not found', async () => {
        const mockPrisma = {
            material: { findMany: vitest_1.vi.fn().mockResolvedValue([]) },
            serviceType: { findMany: vitest_1.vi.fn().mockResolvedValue([]) }
        };
        const input = [{
                serviceTypeId: 'non-existent',
                materialId: null,
                quantity: 1,
            }];
        await (0, vitest_1.expect)((0, order_prep_1.prepareOrderCalculationItems)(mockPrisma, 'org1', input))
            .rejects.toThrow('Tipo de Serviço non-existent não encontrado.');
    });
});
