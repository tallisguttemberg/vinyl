"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer, Edit, Trash2, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function OrderDetailsClient({ id }: { id: string }) {
    const { data: orderData, isLoading } = api.order.getById.useQuery({ id });
    const order = orderData as any;
    const { data: settings } = api.organizationSettings.getSettings.useQuery();
    const { data: user } = api.user.getMe.useQuery();
    const utils = api.useUtils();
    const router = useRouter();

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | null>(null);
    const [adminPassword, setAdminPassword] = useState("");
    const [adminReason, setAdminReason] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const deleteOrder = api.order.delete.useMutation({
        onSuccess: () => {
            toast.success("Ordem excluída com sucesso");
            router.push("/orders");
        },
        onError: (err) => {
            toast.error("Erro ao excluir ordem", { description: err.message });
        }
    });

    const updateStatus = api.order.updateStatus.useMutation({
        onSuccess: () => {
            toast.success("Status atualizado!");
            utils.order.getById.invalidate({ id });
            setIsPasswordModalOpen(false);
            setAdminPassword("");
            setAdminReason("");
            setPasswordError("");
        },
        onError: (error) => {
            if (isPasswordModalOpen) {
                setPasswordError(error.message);
            } else {
                toast.error("Erro ao atualizar status", { description: error.message });
            }
        }
    });


    const handleStatusUpdate = (status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED") => {
        if (!order) return;
        
        const isLockedStatus = order.status === "COMPLETED" || order.status === "CANCELLED";
        if (isLockedStatus && status !== order.status) {
            setPendingStatus(status);
            setIsPasswordModalOpen(true);
            return;
        }

        updateStatus.mutate({ id, status });
    };

    const handlePasswordSubmit = () => {
        if (!pendingStatus) return;
        
        if (!adminPassword) {
            setPasswordError("Senha obrigatória");
            return;
        }

        updateStatus.mutate({ 
            id, 
            status: pendingStatus,
            adminPassword,
            reason: adminReason ? adminReason : undefined
        });
    };

    const handleDelete = () => {
        if (confirm("Tem certeza que deseja excluir esta ordem?")) {
            deleteOrder.mutate({ id });
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Carregando detalhes da ordem...</div>;
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

    const statusColors = {
        PENDING: "secondary",
        IN_PROGRESS: "default",
        COMPLETED: "outline",
        CANCELLED: "destructive",
    } as const;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/orders"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Ordem #{order.id.slice(-4).toUpperCase()}</h2>
                        <p className="text-muted-foreground">{order.customerName} • {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/orders/${order.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8">
                <div className="flex flex-col items-center text-center border-b pb-4 mb-4">
                    {settings?.logoUrl && (
                        <div className="relative h-20 w-80 mb-4 mx-auto">
                            <img
                                src={settings.logoUrl}
                                alt="Logo"
                                className="object-contain h-full w-full"
                            />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold">{settings?.businessName || "Ordem de Serviço / Proposta"}</h1>
                    <div className="text-muted-foreground text-sm space-y-1">
                        {settings?.address && <p>{settings.address}</p>}
                        <div className="flex justify-center gap-4">
                            {settings?.phone && <p>{settings.phone}</p>}
                            {settings?.email && <p>{settings.email}</p>}
                        </div>
                        {settings?.taxId && <p>CNPJ/CPF: {settings.taxId}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Cliente</h3>
                        <p className="text-lg">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="font-semibold text-sm text-muted-foreground">Número / Data</h3>
                        <p>#{order.id.slice(-4).toUpperCase()}</p>
                        <p>{format(new Date(order.createdAt), "dd/MM/yyyy")}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Items List (Left Column) */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Itens do Pedido</CardTitle>
                            <Badge variant={statusColors[order.status as keyof typeof statusColors]}>
                                {order.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Serviço / Material</TableHead>
                                        <TableHead className="text-right">Dimensões</TableHead>
                                        <TableHead className="text-right">Qtd</TableHead>
                                        <TableHead className="text-right">Total Item</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.serviceType.name}</div>
                                                {item.material && (
                                                    <div className="text-sm text-muted-foreground">{item.material.name}</div>
                                                )}
                                                {item.finishings.length > 0 && (
                                                    <div className="mt-1 flex gap-1 flex-wrap">
                                                        {item.finishings.map((finishing: any) => (
                                                             <Badge key={finishing.id} variant="secondary" className="text-[10px] py-0 px-1">
                                                                 + {finishing.name}
                                                             </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.material && (item.material as any).category === "LIQUID" ? (
                                                    <>
                                                        {Number((item as any).mlUsed).toFixed(0)} ml
                                                    </>
                                                ) : (
                                                    <>
                                                        {Number(item.width).toFixed(2)}m x {Number(item.height).toFixed(2)}m
                                                        <div className="text-xs text-muted-foreground">
                                                            {(Number(item.width) * Number(item.height)).toFixed(2)} m²
                                                            {Number(item.wastePercentage) > 0 && <span className="ml-1 text-red-400">({Number(item.wastePercentage)}% desp.)</span>}
                                                        </div>
                                                    </>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                R$ {Number(item.price).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {(order.supplies?.length || 0) > 0 && (
                                <div className="mt-8">
                                    <h4 className="font-semibold text-sm mb-4">Insumos Adicionais</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Insumo</TableHead>
                                                <TableHead className="text-right">Consumo/Qtd</TableHead>
                                                <TableHead className="text-right">Custo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {order.supplies.map((s: any) => (
                                                <TableRow key={s.id}>
                                                    <TableCell className="py-2">{s.supply.name}</TableCell>
                                                    <TableCell className="text-right py-2">{Number(s.quantity).toFixed(2)} {s.supply.unit}</TableCell>
                                                    <TableCell className="text-right py-2 font-medium text-red-500">R$ {Number(s.totalCost).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {(order.equipments?.length || 0) > 0 && (
                                <div className="mt-8">
                                    <h4 className="font-semibold text-sm mb-4">Equipamentos</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Equipamento</TableHead>
                                                <TableHead className="text-right">Dias</TableHead>
                                                <TableHead className="text-right">Custo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {order.equipments.map((e: any) => (
                                                <TableRow key={e.id}>
                                                    <TableCell className="py-2">{e.equipment.name}</TableCell>
                                                    <TableCell className="text-right py-2">{e.days} dias</TableCell>
                                                    <TableCell className="text-right py-2 font-medium text-red-500">R$ {Number(e.totalCost).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Status Update Card (No Print) */}
                    <Card className="no-print">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Atualizar Status</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Button
                                variant={order.status === 'PENDING' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusUpdate('PENDING')}
                                disabled={updateStatus.isPending || (order.status === 'PENDING')}
                            >
                                <Clock className="mr-2 h-4 w-4" /> Pendente
                            </Button>
                            <Button
                                variant={order.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                                disabled={updateStatus.isPending || (order.status === 'IN_PROGRESS')}
                            >
                                <Clock className="mr-2 h-4 w-4" /> Em Produção
                            </Button>
                            <Button
                                variant={order.status === 'COMPLETED' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusUpdate('COMPLETED')}
                                disabled={updateStatus.isPending || (order.status === 'COMPLETED')}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizado
                            </Button>
                            <Button
                                variant={order.status === 'CANCELLED' ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusUpdate('CANCELLED')}
                                disabled={updateStatus.isPending || (order.status === 'CANCELLED')}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Cancelado
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Financial Summary (Right Column) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo Financeiro</CardTitle>
                            <CardDescription>Detalhamento de custos e lucro</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Faturamento Total</span>
                                <span className="text-xl font-bold text-primary">R$ {Number(order.totalAmount).toFixed(2)}</span>
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm no-print">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">(-) Materiais (c/ desperdício)</span>
                                    <span>R$ {Number(order.totalMaterialCost || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">(-) Custo Operacional (Máquina)</span>
                                    <span>R$ {Number(order.totalOperationalCost || 0).toFixed(2)}</span>
                                </div>
                                {Number(order.totalFinishingCost) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">(-) Extras / Acabamentos</span>
                                        <span>R$ {Number(order.totalFinishingCost || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                {Number(order.totalSupplyCost) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">(-) Insumos Adicionais</span>
                                        <span className="text-red-500">- R$ {Number(order.totalSupplyCost).toFixed(2)}</span>
                                    </div>
                                )}
                                {Number(order.totalEquipmentCost) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">(-) Locação / Equipamentos</span>
                                        <span className="text-red-500">- R$ {Number(order.totalEquipmentCost).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">(-) Comissões de Serviço</span>
                                    <span className="text-red-500">- R$ {Number(order.totalServiceCommission).toFixed(2)}</span>
                                </div>
                            </div>

                            <Separator className="no-print" />

                            <div className={`flex justify-between items-center no-print ${Number(order.profit) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <span className="font-medium">Lucro Bruto (DRE)</span>
                                <span className="text-xl font-bold">R$ {Number(order.profit).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm no-print">
                                <span className="text-muted-foreground">Margem Final</span>
                                <Badge variant={Number(order.margin) > 30 ? "default" : Number(order.margin) > 10 ? "secondary" : "destructive"}>
                                    {Number(order.margin).toFixed(1)}%
                                </Badge>
                            </div>

                            {Number(order.margin) < Number(settings?.minimumMarginAllowed || 15) && (
                                <p className="text-[10px] text-red-500 font-medium leading-tight no-print">
                                    ⚠️ Atenção: A margem está abaixo do mínimo permitido ({Number(settings?.minimumMarginAllowed || 15)}%). Esta ordem pode necessitar de autorização especial.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Adicionais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Aplicador</span>
                                <span className="font-medium">{(order as any).aplicador?.nomeCompleto || "Nenhum"}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Criado em</span>
                                <span>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Atualizado em</span>
                                <span>{format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm")}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <Dialog open={isPasswordModalOpen} onOpenChange={(open) => {
                setIsPasswordModalOpen(open);
                if (!open) {
                    setAdminPassword("");
                    setAdminReason("");
                    setPasswordError("");
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Autorização de Administrador Necessária</DialogTitle>
                        <DialogDescription>
                            Esta ordem está <strong>{order.status === 'COMPLETED' ? 'Finalizada' : 'Cancelada'}</strong>.
                            Apenas administradores podem alterar este status.
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

