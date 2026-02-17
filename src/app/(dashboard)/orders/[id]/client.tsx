"use client";

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
import { ArrowLeft, Printer, Edit, Trash2, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function OrderDetailsClient({ id }: { id: string }) {
    const { data: order, isLoading } = api.order.getById.useQuery({ id });
    const { data: settings } = api.organizationSettings.getSettings.useQuery();
    const utils = api.useUtils();
    const router = useRouter();

    const deleteOrder = api.order.delete.useMutation({
        onSuccess: () => {
            router.push("/orders");
        },
    });

    const updateStatus = api.order.updateStatus.useMutation({
        onSuccess: () => {
            utils.order.getById.invalidate({ id });
        },
    });

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
                <div className="text-center border-b pb-4 mb-4">
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
                                    {order.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.serviceType.name}</div>
                                                {item.material && (
                                                    <div className="text-sm text-muted-foreground">{item.material.name}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {Number(item.width).toFixed(2)}m x {Number(item.height).toFixed(2)}m
                                                <div className="text-xs text-muted-foreground">
                                                    {(Number(item.width) * Number(item.height)).toFixed(2)} m²
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                R$ {Number(item.price).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
                                onClick={() => updateStatus.mutate({ id, status: 'PENDING' })}
                                disabled={updateStatus.isPending}
                            >
                                <Clock className="mr-2 h-4 w-4" /> Pendente
                            </Button>
                            <Button
                                variant={order.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateStatus.mutate({ id, status: 'IN_PROGRESS' })}
                                disabled={updateStatus.isPending}
                            >
                                <Clock className="mr-2 h-4 w-4" /> Em Produção
                            </Button>
                            <Button
                                variant={order.status === 'COMPLETED' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateStatus.mutate({ id, status: 'COMPLETED' })}
                                disabled={updateStatus.isPending}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizado
                            </Button>
                            <Button
                                variant={order.status === 'CANCELLED' ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => updateStatus.mutate({ id, status: 'CANCELLED' })}
                                disabled={updateStatus.isPending}
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
                                <span className="text-xl font-bold">R$ {Number(order.totalAmount).toFixed(2)}</span>
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm no-print">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Custo Material</span>
                                    <span>R$ {Number(order.totalCost).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground pl-2">
                                    <span>Perda/Desperdício</span>
                                    <span>{Number(order.wastePercentage)}%</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Comissões</span>
                                    <span>R$ {Number(order.totalCommission).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground pl-2">
                                    <span>Taxa</span>
                                    <span>{Number(order.commissionRate)}%</span>
                                </div>
                            </div>

                            <Separator className="no-print" />

                            <div className="flex justify-between items-center text-green-600 no-print">
                                <span className="font-medium">Lucro Bruto</span>
                                <span className="text-xl font-bold">R$ {Number(order.profit).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm no-print">
                                <span className="text-muted-foreground">Margem</span>
                                <Badge variant={Number(order.margin) > 30 ? "default" : Number(order.margin) > 10 ? "secondary" : "destructive"}>
                                    {Number(order.margin).toFixed(1)}%
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Adicionais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
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
        </div>
    );
}

