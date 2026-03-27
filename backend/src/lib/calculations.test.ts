import { describe, it, expect } from 'vitest';
import { calculateOrder } from './calculations';

describe('calculateOrder', () => {
    it('should calculate a simple order with FIXED billing', () => {
        const input: any = {
            items: [{
                width: 1,
                height: 1,
                quantity: 2,
                billingType: 'FIXED',
                unitPrice: 50,
                wastePercentage: 0,
                finishings: []
            }],
            serviceCommissionRate: 10,
            discountValue: 0,
        };

        const result = calculateOrder(input);

        expect(result.subtotal).toBe(100);
        expect(result.totalRevenue).toBe(100);
        expect(result.totalServiceCommission).toBe(10);
        expect(result.grossProfit).toBe(90);
    });

    it('should calculate an order with PER_M2 billing', () => {
        const input: any = {
            items: [{
                width: 2,
                height: 3,
                quantity: 1,
                billingType: 'PER_M2',
                unitPrice: 10, // 10 per m2. Area = 6. Rev = 60
                wastePercentage: 0,
                finishings: []
            }],
            serviceCommissionRate: 0,
        };

        const result = calculateOrder(input);

        expect(result.subtotal).toBe(60);
        expect(result.items[0].area).toBe(6);
    });

    it('should apply fixed discount correctly', () => {
        const input: any = {
            items: [{
                width: 1,
                height: 1,
                quantity: 1,
                billingType: 'FIXED',
                unitPrice: 100,
            }],
            serviceCommissionRate: 0,
            discountType: 'FIXED',
            discountValue: 20,
        };

        const result = calculateOrder(input);

        expect(result.totalRevenue).toBe(80);
        expect(result.calculatedDiscount).toBe(20);
    });

    it('should apply percentage discount correctly', () => {
        const input: any = {
            items: [{
                width: 1,
                height: 1,
                quantity: 1,
                billingType: 'FIXED',
                unitPrice: 200,
            }],
            serviceCommissionRate: 0,
            discountType: 'PERCENTAGE',
            discountValue: 10,
        };

        const result = calculateOrder(input);

        expect(result.totalRevenue).toBe(180);
        expect(result.calculatedDiscount).toBe(20);
    });

    it('should account for material costs and waste', () => {
        const input: any = {
            items: [{
                width: 1,
                height: 1,
                quantity: 1,
                billingType: 'FIXED',
                unitPrice: 100,
                materialStop: {
                    costPerSqMeter: 40
                },
                wastePercentage: 50 // 50% waste
            }],
            serviceCommissionRate: 0,
        };

        const result = calculateOrder(input);

        expect(result.totalMaterialCost).toBe(60); // 40 + (40 * 0.5)
        expect(result.grossProfit).toBe(40); // 100 - 60
    });

    it('should calculate commission over gross profit when specified', () => {
        const input: any = {
            items: [{
                width: 1,
                height: 1,
                quantity: 1,
                billingType: 'FIXED',
                unitPrice: 100,
                materialStop: { costPerSqMeter: 50 }
            }],
            serviceCommissionRate: 10,
            serviceCommissionBase: 'GROSS_PROFIT'
        };

        const result = calculateOrder(input);

        // Revenue = 100, Cost = 50. Profit Before Commission = 50.
        // Commission = 10% of 50 = 5.
        expect(result.totalRevenue).toBe(100);
        expect(result.totalCost).toBe(50);
        expect(result.totalServiceCommission).toBe(5);
        expect(result.grossProfit).toBe(45);
    });

    it('should include finishing costs and prices', () => {
        const input: any = {
            items: [{
                width: 1,
                height: 1,
                quantity: 1,
                billingType: 'FIXED',
                unitPrice: 100,
                finishings: [
                    { name: 'Ilhós', price: 10, cost: 2 }
                ]
            }],
            serviceCommissionRate: 0,
        };

        const result = calculateOrder(input);

        expect(result.subtotal).toBe(110);
        expect(result.totalFinishingCost).toBe(2);
        expect(result.grossProfit).toBe(108);
    });
});
