"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const calculations_1 = require("./calculations");
(0, vitest_1.describe)('calculateOrder', () => {
    (0, vitest_1.it)('should calculate a simple order with FIXED billing', () => {
        const input = {
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
        const result = (0, calculations_1.calculateOrder)(input);
        (0, vitest_1.expect)(result.subtotal).toBe(100);
        (0, vitest_1.expect)(result.totalRevenue).toBe(100);
        (0, vitest_1.expect)(result.totalServiceCommission).toBe(10);
        (0, vitest_1.expect)(result.grossProfit).toBe(90);
    });
    (0, vitest_1.it)('should calculate an order with PER_M2 billing', () => {
        const input = {
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
        const result = (0, calculations_1.calculateOrder)(input);
        (0, vitest_1.expect)(result.subtotal).toBe(60);
        (0, vitest_1.expect)(result.items[0].area).toBe(6);
    });
    (0, vitest_1.it)('should apply fixed discount correctly', () => {
        const input = {
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
        const result = (0, calculations_1.calculateOrder)(input);
        (0, vitest_1.expect)(result.totalRevenue).toBe(80);
        (0, vitest_1.expect)(result.calculatedDiscount).toBe(20);
    });
    (0, vitest_1.it)('should apply percentage discount correctly', () => {
        const input = {
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
        const result = (0, calculations_1.calculateOrder)(input);
        (0, vitest_1.expect)(result.totalRevenue).toBe(180);
        (0, vitest_1.expect)(result.calculatedDiscount).toBe(20);
    });
    (0, vitest_1.it)('should account for material costs and waste', () => {
        const input = {
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
        const result = (0, calculations_1.calculateOrder)(input);
        (0, vitest_1.expect)(result.totalMaterialCost).toBe(60); // 40 + (40 * 0.5)
        (0, vitest_1.expect)(result.grossProfit).toBe(40); // 100 - 60
    });
    (0, vitest_1.it)('should calculate commission over gross profit when specified', () => {
        const input = {
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
        const result = (0, calculations_1.calculateOrder)(input);
        // Revenue = 100, Cost = 50. Profit Before Commission = 50.
        // Commission = 10% of 50 = 5.
        (0, vitest_1.expect)(result.totalRevenue).toBe(100);
        (0, vitest_1.expect)(result.totalCost).toBe(50);
        (0, vitest_1.expect)(result.totalServiceCommission).toBe(5);
        (0, vitest_1.expect)(result.grossProfit).toBe(45);
    });
    (0, vitest_1.it)('should include finishing costs and prices', () => {
        const input = {
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
        const result = (0, calculations_1.calculateOrder)(input);
        (0, vitest_1.expect)(result.subtotal).toBe(110);
        (0, vitest_1.expect)(result.totalFinishingCost).toBe(2);
        (0, vitest_1.expect)(result.grossProfit).toBe(108);
    });
});
