"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOrder = calculateOrder;
exports.calculateMaterialCost = calculateMaterialCost;
exports.calculateLiquidCost = calculateLiquidCost;
function calculateOrder(input) {
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
        }
        else { // PER_M2
            revenue = item.unitPrice * area;
        }
        // 2. Calculate Finishings Revenue & Cost
        let finishingRev = 0;
        let finishingCost = 0;
        if (item.finishings && item.finishings.length > 0) {
            for (const f of item.finishings) {
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
            }
            else if (item.materialStop.costPerSqMeter) {
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
    // 5. Calculate Supplies Cost
    let totalSupplyCost = 0;
    const totalArea = itemsResult.reduce((acc, i) => acc + i.area, 0);
    if (input.supplies && input.supplies.length > 0) {
        for (const s of input.supplies) {
            const cost = s.quantity * s.unitCost;
            totalSupplyCost += cost;
        }
    }
    // 6. Calculate Equipment Cost
    let totalEquipmentCost = 0;
    if (input.equipment && input.equipment.length > 0) {
        for (const e of input.equipment) {
            totalEquipmentCost += e.dailyCost * e.days;
        }
    }
    // 7. Apply Discount
    let finalRevenue = totalRevenue;
    let actualDiscountValue = 0;
    if (input.discountType === 'FIXED' && input.discountValue) {
        actualDiscountValue = input.discountValue;
    }
    else if (input.discountType === 'PERCENTAGE' && input.discountValue) {
        actualDiscountValue = totalRevenue * (input.discountValue / 100);
    }
    finalRevenue = Math.max(0, finalRevenue - actualDiscountValue);
    const totalCost = totalMaterialCost + totalOperationalCost + totalFinishingCost + totalSupplyCost + totalEquipmentCost;
    // 8. Calculate Commission
    let commissionBaseValue = finalRevenue;
    if (input.serviceCommissionBase === 'GROSS_PROFIT') {
        commissionBaseValue = Math.max(0, finalRevenue - totalCost);
    }
    const totalServiceCommission = commissionBaseValue * (input.serviceCommissionRate / 100);
    // 9. Calculate Net Profit
    const grossProfit = finalRevenue - totalCost - totalServiceCommission;
    // 10. Calculate Margin
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
        totalSupplyCost: Number(totalSupplyCost.toFixed(2)),
        totalEquipmentCost: Number(totalEquipmentCost.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        totalServiceCommission: Number(totalServiceCommission.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        margin: Number(margin.toFixed(2)),
        totalArea,
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
function calculateMaterialCost(pricePerRoll, rollLength, width) {
    if (!rollLength || !width)
        return { costPerLinearMeter: 0, costPerSqMeter: 0 };
    const costPerLinearMeter = pricePerRoll / rollLength;
    const costPerSqMeter = costPerLinearMeter / width;
    return {
        costPerLinearMeter: Number(costPerLinearMeter.toFixed(2)),
        costPerSqMeter: Number(costPerSqMeter.toFixed(2))
    };
}
function calculateLiquidCost(price, volume) {
    if (!volume)
        return { costPerMl: 0 };
    const costPerMl = price / volume;
    return {
        costPerMl: Number(costPerMl.toFixed(2))
    };
}
