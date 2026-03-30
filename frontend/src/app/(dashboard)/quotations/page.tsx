"use client";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Edit, Trash2, MoreHorizontal, CheckCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";

export default function QuotationsPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const utils = api.useUtils();
    
    // Pegamos todas as ordens, mas filtramos por tipo QUOTATION no componente por enquanto
    // (Poderíamos adicionar um filtro de tipo no getAll se necessário)
    const { data: orders, isLoading } = api.order.getAll.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("orders", "visualizar"),
    });

    const quotations = orders?.filter((o: any) => o.type === "QUOTATION");

    const deleteOrder = api.order.delete.useMutation({
        onSuccess: () => {
            toast.success("Orçamento excluído com sucesso");
            utils.order.getAll.invalidate();
        },
    });

    const convertToOrder = api.order.convertToOrder.useMutation({
        onSuccess: () => {
            toast.success("Orçamento aprovado! Convertido em Ordem de Serviço.");
            utils.order.getAll.invalidate();
        },
        onError: (err) => {
            toast.error("Erro ao converter orçamento: " + err.message);
        }
    });

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja excluir este orçamento?")) {
            deleteOrder.mutate({ id });
        }
    };

    const handleApprove = (id: string) => {
        if (confirm("Deseja aprovar este orçamento e gerar uma Ordem de Serviço vinculada ao Financeiro?")) {
            convertToOrder.mutate({ id });
        }
    };

    if (!loadingPerms && !hasPermission("orders", "visualizar")) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para visualizar este módulo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Orçamentos & Propostas</h2>
                    <p className="text-muted-foreground">Gerencie orçamentos feitos no mobile ou web antes de virarem OS.</p>
                </div>
                {hasPermission("orders", "criar") && (
                    <Button asChild className="bg-violet-600 hover:bg-violet-700">
                        <Link href="/orders/new?type=QUOTATION">
                            <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
                        </Link>
                    </Button>
                )}
            </div>

            <div className="rounded-md border overflow-x-auto bg-card shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Lucro Previsto</TableHead>
                            <TableHead>Margem</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">Carregando...</TableCell>
                            </TableRow>
                        ) : !quotations || quotations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">
                                    <div className="flex flex-col items-center space-y-2">
                                        <FileText className="h-10 w-10 text-muted-foreground/50" />
                                        <p className="text-muted-foreground">Nenhum orçamento pendente encontrado.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            quotations.map((order: any) => (
                                <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-medium">{order.customerName}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="outline" 
                                            className={
                                                order.status === 'DRAFT' ? 'border-zinc-500 text-zinc-500' : 
                                                'border-violet-500 text-violet-500'
                                            }
                                        >
                                            {order.status === 'QUOTATION' ? 'PROPOSTA ENVIADA' : order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold text-zinc-900">R$ {Number(order.totalAmount).toFixed(2)}</TableCell>
                                    <TableCell className="text-green-600 font-medium italic">R$ {Number(order.profit).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-12 bg-zinc-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-500" 
                                                    style={{ width: `${Math.min(Number(order.margin), 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold">{Number(order.margin).toFixed(1)}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {hasPermission("orders", "editar") && (
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    title="Aprovar e Gerar OS"
                                                    onClick={() => handleApprove(order.id)}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/orders/${order.id}`}>Visualizar Proposta</Link>
                                                    </DropdownMenuItem>
                                                    {hasPermission("orders", "editar") && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/orders/${order.id}/edit`}>Editar Valores</Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem 
                                                        className="text-green-600 font-bold"
                                                        onClick={() => handleApprove(order.id)}
                                                    >
                                                        Aprovar Cliente
                                                    </DropdownMenuItem>
                                                    {hasPermission("orders", "excluir") && (
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(order.id)}
                                                        >
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
