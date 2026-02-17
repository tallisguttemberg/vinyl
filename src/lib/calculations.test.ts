import { describe, it, expect } from 'vitest';
import { calculateOrder, calculateMaterialCost, CalculationInput } from './calculations';

describe('Calculations', () => {
    describe('calculateMaterialCost', () => {
        it('should calculate cost per linear and sq meter correctly', () => {
            // Roll: 50m long, 1.5m wide, cost $500
            // Cost per linear meter = 500 / 50 = $10
            // Cost per sq meter = 10 / 1.5 = $6.666... -> 6.67
            const result = calculateMaterialCost(500, 50, 1.5);
            expect(result.costPerLinearMeter).toBe(10);
            expect(result.costPerSqMeter).toBe(6.67);
        });
    });

    describe('calculateOrder', () => {
        it('should calculate revenue for FIXED billing', () => {
            const input: CalculationInput = {
                items: [
                    {
                        width: 1, height: 1, quantity: 2, billingType: 'FIXED', unitPrice: 100,
                        materialStop: undefined
                    }
                ],
                commissionRate: 0,
                wastePercentage: 0
            };
            const result = calculateOrder(input);
            expect(result.totalRevenue).toBe(200); // 2 * 100
            expect(result.grossProfit).toBe(200);
        });

        it('should calculate revenue for PER_M2 billing', () => {
            const input: CalculationInput = {
                items: [
                    {
                        width: 2, height: 1, quantity: 1, billingType: 'PER_M2', unitPrice: 50, // 2m2 * 50 = 100
                        materialStop: undefined
                    }
                ],
                commissionRate: 0,
                wastePercentage: 0
            };
            const result = calculateOrder(input);
            expect(result.totalRevenue).toBe(100);
        });

        it('should calculate material cost with waste', () => {
            // Area = 2 * 1 = 2m2
            // Material Cost = 2 * 10 = 20
            // Waste 10% -> 20 * 1.1 = 22
            const input: CalculationInput = {
                items: [
                    {
                        width: 2, height: 1, quantity: 1, billingType: 'PER_M2', unitPrice: 100,
                        materialStop: { costPerSqMeter: 10 }
                    }
                ],
                commissionRate: 0,
                wastePercentage: 10
            };
            const result = calculateOrder(input);
            expect(result.totalMaterialCost).toBe(22);
            expect(result.items[0].materialCost).toBe(22);
        });

        it('should calculate commission', () => {
            // Revenue = 100
            // Commission 10% = 10
            const input: CalculationInput = {
                items: [
                    {
                        width: 1, height: 1, quantity: 1, billingType: 'FIXED', unitPrice: 100,
                        materialStop: undefined
                    }
                ],
                commissionRate: 10,
                wastePercentage: 0
            };
            const result = calculateOrder(input);
            expect(result.totalRevenue).toBe(100);
            expect(result.totalCommission).toBe(10);
            expect(result.grossProfit).toBe(90); // 100 - 10
        });

        it('should calculate margin', () => {
            // Revenue 100
            // Material 20
            // Commission 10
            // Profit = 70
            // Margin = 70%
            const input: CalculationInput = {
                items: [
                    {
                        width: 1, height: 1, quantity: 1, billingType: 'FIXED', unitPrice: 100,
                        materialStop: { costPerSqMeter: 20 }
                    }
                ],
                commissionRate: 10,
                wastePercentage: 0
            };
            const result = calculateOrder(input);
            expect(result.grossProfit).toBe(70);
            expect(result.margin).toBe(70);
        });
    });
});
