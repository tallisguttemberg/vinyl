
import { Decimal } from '@prisma/client/runtime/library';

export interface CalculationInput {
    items: {
        width: number; // meters
        height: number; // meters
        mlUsed?: number; // Added for liquids
        quantity: number;
        billingType: 'FIXED' | 'PER_M2';
        unitPrice: number; // if FIXED: price per item, if PER_M2: price per m2
        materialStop?: {
            costPerSqMeter?: number;
            costPerMl?: number; // Added for liquids
        };
        operationalCostPerM2?: number; // Machine/Overhead cost
        wastePercentage?: number; // Item specific waste
        finishings?: {
            name: string;
            price: number;
            cost: number;
        }[];
    }[];
    commissionRate: number; // percentage, e.g., 10 for 10%
    commissionBase?: 'GROSS_REVENUE' | 'GROSS_PROFIT'; // Default usually GROSS_REVENUE
    discountType?: string; // "PERCENTAGE" | "FIXED"
    discountValue?: number;
}

export interface CalculationResult {
    subtotal: number;
    calculatedDiscount: number;
    totalRevenue: number;
    totalMaterialCost: number;       // Just raw material + waste
    totalOperationalCost: number;    // Machine + overhead
    totalFinishingCost: number;      // Cost from finishings
    totalCost: number;               // material + operational + finishing
    totalCommission: number;
    grossProfit: number;             // Revenue - Total Cost - Commission
    margin: number;                  // (Net Profit / Revenue) * 100
    items: {
        revenue: number;
        materialCost: number;
        operationalCost: number;
        finishingCost: number;
        area: number; // m2
        mlUsed?: number;
    }[];
}

export function calculateOrder(input: CalculationInput): CalculationResult {
    let totalRevenue = 0;
    let totalMaterialCost = 0;
    let totalOperationalCost = 0;
    let totalFinishingCost = 0;

    const itemsResult = input.items.map((item) => {
        // 1. Calculate Revenue (Base)
        let revenue = 0;
        const area = item.width * item.height * item.quantity;

        if (item.billingType === 'FIXED') {
            revenue = item.unitPrice * item.quantity;
        } else { // PER_M2
            revenue = item.unitPrice * area;
        }

        // 2. Calculate Finishings Revenue & Cost
        let finishingRev = 0;
        let finishingCost = 0;
        if (item.finishings && item.finishings.length > 0) {
            for (const f of item.finishings) {
                // Assuming finishings in the input are already multiplied by quantity if they are linear/fixed
                // For simplicity, we just sum them up directly.
                finishingRev += f.price;
                finishingCost += f.cost;
            }
            revenue += finishingRev;
        }

        // 3. Calculate Material Cost (Base + Waste)
        let rawMaterialCost = 0;
        if (item.materialStop) {
            if (item.materialStop.costPerMl && item.mlUsed) {
                rawMaterialCost = item.mlUsed * item.materialStop.costPerMl * item.quantity;
            } else if (item.materialStop.costPerSqMeter) {
                rawMaterialCost = area * item.materialStop.costPerSqMeter;
            }
        }
        
        const wasteMultiplier = 1 + ((item.wastePercentage || 0) / 100);
        const materialCostWithWaste = rawMaterialCost * wasteMultiplier;

        // 4. Calculate Operational Cost
        let opCost = 0;
        if (item.operationalCostPerM2 && area > 0) {
             opCost = item.operationalCostPerM2 * area;
        }

        // Accumulate totals
        totalRevenue += revenue;
        totalMaterialCost += materialCostWithWaste;
        totalOperationalCost += opCost;
        totalFinishingCost += finishingCost;

        return {
            revenue,
            materialCost: materialCostWithWaste,
            operationalCost: opCost,
            finishingCost: finishingCost,
            area,
            mlUsed: item.mlUsed
        };
    });

    // 5. Apply Discount
    let finalRevenue = totalRevenue;
    let actualDiscountValue = 0;
    if (input.discountType === 'FIXED' && input.discountValue) {
        actualDiscountValue = input.discountValue;
    } else if (input.discountType === 'PERCENTAGE' && input.discountValue) {
        actualDiscountValue = totalRevenue * (input.discountValue / 100);
    }
    finalRevenue = Math.max(0, finalRevenue - actualDiscountValue);

    const totalCost = totalMaterialCost + totalOperationalCost + totalFinishingCost;

    // 6. Calculate Commission
    let commissionBaseValue = finalRevenue;
    if (input.commissionBase === 'GROSS_PROFIT') {
        // Commission over profit (Revenue - Costs)
        commissionBaseValue = Math.max(0, finalRevenue - totalCost);
    }
    const totalCommission = commissionBaseValue * (input.commissionRate / 100);

    // 7. Calculate Net Profit
    // Net Profit = Final Revenue - Total Cost - Commission
    const grossProfit = finalRevenue - totalCost - totalCommission;

    // 8. Calculate Margin
    // Margin % = (Net Profit / Final Revenue) * 100
    let margin = 0;
    if (finalRevenue > 0) {
        margin = (grossProfit / finalRevenue) * 100;
    }

    return {
        subtotal: Number(totalRevenue.toFixed(2)),
        calculatedDiscount: Number(actualDiscountValue.toFixed(2)),
        totalRevenue: Number(finalRevenue.toFixed(2)),
        totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
        totalOperationalCost: Number(totalOperationalCost.toFixed(2)),
        totalFinishingCost: Number(totalFinishingCost.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        totalCommission: Number(totalCommission.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        margin: Number(margin.toFixed(2)),
        items: itemsResult.map(i => ({
            revenue: Number(i.revenue.toFixed(2)),
            materialCost: Number(i.materialCost.toFixed(2)),
            operationalCost: Number(i.operationalCost.toFixed(2)),
            finishingCost: Number(i.finishingCost.toFixed(2)),
            area: i.area,
            mlUsed: i.mlUsed
        }))
    };
}

export function calculateMaterialCost(pricePerRoll: number, rollLength: number, width: number) {
    if (!rollLength || !width) return { costPerLinearMeter: 0, costPerSqMeter: 0 };
    const costPerLinearMeter = pricePerRoll / rollLength;
    const costPerSqMeter = costPerLinearMeter / width;

    return {
        costPerLinearMeter: Number(costPerLinearMeter.toFixed(2)),
        costPerSqMeter: Number(costPerSqMeter.toFixed(2))
    };
}

export function calculateLiquidCost(price: number, volume: number) {
    if (!volume) return { costPerMl: 0 };
    const costPerMl = price / volume;

    return {
        costPerMl: Number(costPerMl.toFixed(2))
    };
}
