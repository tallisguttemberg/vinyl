"use client";

import { api } from "@/trpc/react";
import { OrderForm } from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function OrderEditClient({ id }: { id: string }) {
    const { data: order, isLoading } = api.order.getById.useQuery({ id });

    if (isLoading) {
        return <div className="p-8 text-center">Carregando dados da ordem...</div>;
    }

    if (!order) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-4">Ordem não encontrada</h2>
                <Button asChild>
                    <Link href="/orders">Voltar para lista</Link>
                </Button>
            </div>
        );
    }

    const initialValues = {
        customerName: order.customerName,
        commissionRate: Number(order.commissionRate),
        wastePercentage: Number(order.wastePercentage),
        items: order.items.map(item => ({
            serviceTypeId: item.serviceTypeId,
            materialId: item.materialId,
            width: Number(item.width),
            height: Number(item.height),
            quantity: item.quantity,
            unitPrice: Number(item.price) / item.quantity, // Price stored is total for item
        })),
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/orders/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">Editar Ordem #{id.slice(-4).toUpperCase()}</h2>
            </div>

            <OrderForm initialValues={initialValues} orderId={id} isEditing={true} />
        </div>
    );
}
