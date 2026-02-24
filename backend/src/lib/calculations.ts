
import { Decimal } from '@prisma/client/runtime/library';

export interface CalculationInput {
    items: {
        width: number; // meters
        height: number; // meters
        quantity: number;
        billingType: 'FIXED' | 'PER_M2';
        unitPrice: number; // if FIXED: price per item, if PER_M2: price per m2
        materialStop?: {
            costPerSqMeter: number;
        };
    }[];
    commissionRate: number; // percentage, e.g., 10 for 10%
    wastePercentage: number; // percentage, e.g., 5 for 5%
}

export interface CalculationResult {
    totalRevenue: number;
    totalMaterialCost: number;
    totalCommission: number;
    grossProfit: number;
    margin: number;
    items: {
        revenue: number;
        materialCost: number;
        area: number; // m2
    }[];
}

export function calculateOrder(input: CalculationInput): CalculationResult {
    let totalRevenue = 0;
    let rawMaterialCost = 0;

    const itemsResult = input.items.map((item) => {
        // 1. Calculate Revenue
        let revenue = 0;
        const area = item.width * item.height * item.quantity;

        if (item.billingType === 'FIXED') {
            revenue = item.unitPrice * item.quantity;
        } else { // PER_M2
            revenue = item.unitPrice * area;
        }

        // 2. Calculate Material Cost (Base)
        let materialCost = 0;
        if (item.materialStop) {
            materialCost = area * item.materialStop.costPerSqMeter;
        }

        totalRevenue += revenue;
        rawMaterialCost += materialCost;

        return {
            revenue,
            materialCost, // This is raw cost before waste
            area
        };
    });

    // 3. Apply Waste to Material Cost
    const wasteMultiplier = 1 + (input.wastePercentage / 100);
    const totalMaterialCost = rawMaterialCost * wasteMultiplier;

    // 4. Calculate Commission
    // Commission is usually on Revenue
    const totalCommission = totalRevenue * (input.commissionRate / 100);

    // 5. Calculate Profit
    // Profit = Revenue - Material Cost - Commission
    const grossProfit = totalRevenue - totalMaterialCost - totalCommission;

    // 6. Calculate Margin
    // Margin % = (Profit / Revenue) * 100
    let margin = 0;
    if (totalRevenue > 0) {
        margin = (grossProfit / totalRevenue) * 100;
    }

    // Update item costs to include waste for distributed clarity if needed, 
    // but for now we return the aggregates as requested.
    // We can distribute the waste cost back to items if needed for per-item profit,
    // but usually global order margin is what's displayed.

    return {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
        totalCommission: Number(totalCommission.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        margin: Number(margin.toFixed(2)),
        items: itemsResult.map(i => ({
            ...i,
            materialCost: Number((i.materialCost * wasteMultiplier).toFixed(2)) // Distributing waste for item view
        }))
    };
}

export function calculateMaterialCost(pricePerRoll: number, rollLength: number, width: number) {
    const costPerLinearMeter = pricePerRoll / rollLength;
    const costPerSqMeter = costPerLinearMeter / width;

    return {
        costPerLinearMeter: Number(costPerLinearMeter.toFixed(2)),
        costPerSqMeter: Number(costPerSqMeter.toFixed(2))
    };
}
