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
        vendedorId: (order as any).vendedorId ?? null,
        commissionRate: Number(order.commissionRate),
        discountType: ((order as any).discountType ?? "PERCENTAGE") as "PERCENTAGE" | "FIXED",
        discountValue: Number((order as any).discountValue ?? 0),
        items: order.items.map(item => ({
            serviceTypeId: item.serviceTypeId,
            materialId: item.materialId,
            width: Number(item.width),
            height: Number(item.height),
            mlUsed: Number((item as any).mlUsed || 0),
            quantity: item.quantity,
            priceInputType: "UNIT" as const,
            unitPrice: Number(item.price) / item.quantity,
            wastePercentage: Number((item as any).wastePercentage || 0),
            finishings: (item as any).finishings ? (item as any).finishings.map((f: any) => ({
                 name: f.name,
                 price: Number(f.price),
                 cost: Number(f.cost),
            })) : [],
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
