"use client";

import { OrderForm } from "@/components/orders/OrderForm";

export default function NewOrderPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Nova Ordem de Serviço</h2>
            </div>

            <OrderForm />
        </div>
    );
}

