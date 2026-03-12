"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Users, Clock, CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePermission } from "@/hooks/usePermission";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

const COLUMNS = [
    { id: "PENDING", title: "Pendente", icon: Clock, color: "text-yellow-500" },
    { id: "IN_PROGRESS", title: "Em Produção", icon: PlayCircle, color: "text-blue-500" },
    { id: "COMPLETED", title: "Finalizado", icon: CheckCircle2, color: "text-green-500" },
    { id: "CANCELLED", title: "Cancelado", icon: XCircle, color: "text-red-500" },
] as const;

export default function DashboardPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const utils = api.useUtils();

    // Check for dashboard visualization
    const canViewDashboard = hasPermission("dashboard", "visualizar");
    const canEditOrders = hasPermission("orders", "editar");

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [pendingDragData, setPendingDragData] = useState<{ id: string, status: any } | null>(null);
    const [adminPassword, setAdminPassword] = useState("");
    const [adminReason, setAdminReason] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const { data: stats, isLoading: statsLoading } = api.order.getDashboardStats.useQuery(undefined, {
        enabled: !loadingPerms && canViewDashboard,
    });
    const { data: orders, isLoading: ordersLoading } = api.order.getAll.useQuery(undefined, {
        enabled: !loadingPerms && canViewDashboard,
    });

    const updateStatus = api.order.updateStatus.useMutation({
        onSuccess: () => {
            utils.order.getAll.invalidate();
            utils.order.getDashboardStats.invalidate();
            utils.material.getAll.invalidate(); // Invalidate materials because stock might change
            
            toast.success("Status atualizado com sucesso");
            setIsPasswordModalOpen(false);
            setAdminPassword("");
            setAdminReason("");
            setPasswordError("");
            setPendingDragData(null);
        },
        onError: (err) => {
            if (isPasswordModalOpen) {
                setPasswordError(err.message);
            } else {
                toast.error("Erro ao atualizar status", { description: err.message });
            }
        }
    });

    const onDragEnd = (result: DropResult) => {
        if (!canEditOrders) return;
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const isLockedStatus = source.droppableId === "COMPLETED" || source.droppableId === "CANCELLED";
        if (isLockedStatus) {
            setPendingDragData({
                id: draggableId,
                status: destination.droppableId
            });
            setIsPasswordModalOpen(true);
            return;
        }

        updateStatus.mutate({
            id: draggableId,
            status: destination.droppableId as any
        });
    };

    const handlePasswordSubmit = () => {
        if (!pendingDragData) return;
        
        if (!adminPassword) {
            setPasswordError("Senha obrigatória");
            return;
        }

        updateStatus.mutate({ 
            id: pendingDragData.id, 
            status: pendingDragData.status,
            adminPassword,
            reason: adminReason ? adminReason : undefined
        });
    };

    if (!loadingPerms && !canViewDashboard) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para visualizar o Dashboard.</p>
            </div>
        );
    }

    if (statsLoading || ordersLoading || loadingPerms) {
        return <DashboardSkeleton />;
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
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-muted-foreground">
                                {stats?.orderCount} ordens ativas
                            </p>
                            <p className="text-[10px] font-medium text-sky-500">
                                Projetado: R$ {stats?.projectedRevenue.toFixed(2)}
                            </p>
                        </div>
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
                        <div className="flex justify-end mt-1">
                            <p className="text-[10px] font-medium text-red-400">
                                Projetado: R$ {stats?.projectedMaterialCost.toFixed(2)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comissões</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">R$ {stats?.totalCommission.toFixed(2)}</div>
                        <div className="flex justify-end mt-1">
                            <p className="text-[10px] font-medium text-orange-400">
                                Projetado: R$ {stats?.projectedCommission.toFixed(2)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <section className="space-y-4 pb-12">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Relatório de Comissões</h3>
                    <p className="text-sm text-muted-foreground">Estatísticas por vendedor baseadas em ordens finalizadas.</p>
                </div>
                
                <CommissionReport />
            </section>
            
            <Dialog open={isPasswordModalOpen} onOpenChange={(open) => {
                setIsPasswordModalOpen(open);
                if (!open) {
                    setAdminPassword("");
                    setAdminReason("");
                    setPasswordError("");
                    setPendingDragData(null);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Autorização de Administrador Necessária</DialogTitle>
                        <DialogDescription>
                            Esta ordem está <strong>Finalizada ou Cancelada</strong>.
                            Apenas administradores podem alterar este status através do quadro.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="adminPassword">Senha do Administrador</Label>
                            <Input
                                id="adminPassword"
                                type="password"
                                placeholder="Digite sua senha"
                                value={adminPassword}
                                onChange={(e) => {
                                    setAdminPassword(e.target.value);
                                    setPasswordError("");
                                }}
                            />
                            {passwordError && (
                                <p className="text-sm text-red-500 font-medium">{passwordError}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminReason">Motivo / Justificativa (Opcional)</Label>
                            <Input
                                id="adminReason"
                                type="text"
                                placeholder="Descreva por que está alterando esta ordem"
                                value={adminReason}
                                onChange={(e) => setAdminReason(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handlePasswordSubmit} disabled={updateStatus.isPending}>
                            {updateStatus.isPending ? "Verificando..." : "Confirmar e Alterar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CommissionReport() {
    const { data: report, isLoading } = api.order.getCommissionReport.useQuery();

    if (isLoading) return <div className="text-sm">Carregando relatório...</div>;
    if (!report || report.length === 0) return <div className="text-sm text-muted-foreground">Nenhuma comissão registrada para ordens finalizadas.</div>;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {report.map((item) => (
                <Card key={item.id} className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between items-center">
                            <span>{item.name}</span>
                            <Badge variant="outline" className="text-[10px]">{item.username}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Ordens:</span>
                                <span className="font-semibold">{item.orderCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Vendas Totais:</span>
                                <span className="font-semibold">R$ {item.totalRevenue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg border-t pt-2 mt-2">
                                <span className="font-bold text-primary">Comissão:</span>
                                <span className="font-bold text-primary">R$ {item.totalCommission.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
