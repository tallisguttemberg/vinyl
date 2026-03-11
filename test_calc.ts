import { calculateOrder } from './backend/src/lib/calculations';
console.log(calculateOrder({
    items: [
        { width: 3, height: 3, quantity: 1, billingType: 'PER_M2', unitPrice: 63 }
    ],
    commissionRate: 0,
    wastePercentage: 0
}));
