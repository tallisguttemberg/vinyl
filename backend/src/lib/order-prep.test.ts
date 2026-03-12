import { describe, it, expect, vi } from 'vitest';
import { prepareOrderCalculationItems } from './order-prep';

describe('prepareOrderCalculationItems', () => {
    it('should correctly map raw items to calculation items by fetching from db', async () => {
        // 1. Mock Prisma
        const mockPrisma: any = {
            material: {
                findMany: vi.fn().mockResolvedValue([
                    { id: 'mat1', costPerSqMeter: 10, costPerMl: 0 }
                ])
            },
            serviceType: {
                findMany: vi.fn().mockResolvedValue([
                    { id: 'svc1', billingType: 'PER_M2', wastePercentage: 5, operationalCostPerM2: 2 }
                ])
            }
        };

        const input: any = [{
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
        const result = await prepareOrderCalculationItems(mockPrisma, 'org1', input);

        // 3. Assert
        expect(result).toHaveLength(1);
        expect(result[0].billingType).toBe('PER_M2');
        expect(result[0].wastePercentage).toBe(5); // Came from serviceType
        expect(result[0].materialStop?.costPerSqMeter).toBe(10);
        expect(mockPrisma.material.findMany).toHaveBeenCalled();
        expect(mockPrisma.serviceType.findMany).toHaveBeenCalled();
    });

    it('should throw error if service type is not found', async () => {
        const mockPrisma: any = {
            material: { findMany: vi.fn().mockResolvedValue([]) },
            serviceType: { findMany: vi.fn().mockResolvedValue([]) }
        };

        const input: any = [{
            serviceTypeId: 'non-existent',
            materialId: null,
            quantity: 1,
        }];

        await expect(prepareOrderCalculationItems(mockPrisma, 'org1', input))
            .rejects.toThrow('Tipo de Serviço non-existent não encontrado.');
    });
});
