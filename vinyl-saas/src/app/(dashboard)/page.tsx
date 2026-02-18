"use client";

import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Users, Clock, CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const COLUMNS = [
    { id: "PENDING", title: "Pendente", icon: Clock, color: "text-yellow-500" },
    { id: "IN_PROGRESS", title: "Em Produção", icon: PlayCircle, color: "text-blue-500" },
    { id: "COMPLETED", title: "Finalizado", icon: CheckCircle2, color: "text-green-500" },
    { id: "CANCELLED", title: "Cancelado", icon: XCircle, color: "text-red-500" },
] as const;

export default function DashboardPage() {
    const utils = api.useUtils();
    const { data: stats, isLoading: statsLoading } = api.order.getDashboardStats.useQuery();
    const { data: orders, isLoading: ordersLoading } = api.order.getAll.useQuery();

    const updateStatus = api.order.updateStatus.useMutation({
        onSuccess: () => {
            utils.order.getAll.invalidate();
            utils.order.getDashboardStats.invalidate();
            utils.material.getAll.invalidate(); // Invalidate materials because stock might change
        },
        onError: (err) => {
            alert("Erro ao atualizar status: " + err.message);
        }
    });

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        updateStatus.mutate({
            id: draggableId,
            status: destination.droppableId as any
        });
    };

    if (statsLoading || ordersLoading) {
        return <div className="p-8">Carregando dashboard...</div>;
    }

    const ordersByStatus = (status: string) =>
        orders?.filter((order) => order.status === status) || [];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Gerencie suas ordens de serviço e acompanhe o desempenho.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {stats?.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.orderCount} ordens ativas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Bruto (Realizado)</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">R$ {stats?.grossProfit.toFixed(2)}</div>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-muted-foreground">
                                Margem Média: {stats?.margin.toFixed(1)}%
                            </p>
                            <p className="text-[10px] font-medium text-blue-500">
                                Projetado: R$ {stats?.projectedProfit.toFixed(2)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Custo Material</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">R$ {stats?.totalMaterialCost.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comissões</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">R$ {stats?.totalCommission.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
                    {COLUMNS.map((column) => (
                        <div key={column.id} className="flex flex-col bg-muted/50 rounded-lg p-4 min-h-[500px]">
                            <div className="flex items-center gap-2 mb-4">
                                <column.icon className={`h-5 w-5 ${column.color}`} />
                                <h3 className="font-semibold">{column.title}</h3>
                                <Badge variant="secondary" className="ml-auto">
                                    {ordersByStatus(column.id).length}
                                </Badge>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex-1 space-y-3"
                                    >
                                        {ordersByStatus(column.id).map((order, index) => (
                                            <Draggable key={order.id} draggableId={order.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <Link href={`/orders/${order.id}`}>
                                                            <Card className="hover:border-primary transition-colors">
                                                                <CardHeader className="p-3">
                                                                    <div className="text-sm font-bold truncate">
                                                                        {order.customerName}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        #{order.id.slice(-6).toUpperCase()}
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="p-3 pt-0">
                                                                    <div className="text-lg font-bold">
                                                                        R$ {Number(order.totalAmount).toFixed(2)}
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground mt-1">
                                                                        {order.items.length} itens • {new Date(order.createdAt).toLocaleDateString()}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </Link>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
