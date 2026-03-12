"use client";

import { useState } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { FinancialForm, FinancialFormValues } from "@/components/financial/FinancialForm";
import { usePermission } from "@/hooks/usePermission";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function FinancialPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<{ id: string } & Partial<FinancialFormValues> | null>(null);
    const utils = api.useUtils();
    
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

    const { data: summary, isLoading: loadingSummary } = api.financial.getSummary.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("financial", "visualizar"),
    });

    const { data: dailyMetrics, isLoading: loadingMetrics } = api.financial.getDailyMetrics.useQuery({ days: 30 }, {
        enabled: !loadingPerms && hasPermission("financial", "visualizar"),
    });

    const { data: transactionsData, isLoading } = api.financial.getAll.useQuery({
        page,
        type: typeFilter !== "ALL" ? typeFilter as any : undefined,
        status: statusFilter !== "ALL" ? statusFilter as any : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    }, {
        enabled: !loadingPerms && hasPermission("financial", "visualizar"),
    });

    const transactions = transactionsData?.transactions;
    const totalPages = transactionsData?.totalPages || 0;

    if (!loadingPerms && !hasPermission("financial", "visualizar")) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para visualizar este módulo.</p>
            </div>
        );
    }

    const createTx = api.financial.create.useMutation({
        onSuccess: () => {
            utils.financial.getAll.invalidate();
            utils.financial.getSummary.invalidate();
            utils.financial.getDailyMetrics.invalidate();
            setCreateOpen(false);
        },
        onError: (error) => {
            toast.error("Erro ao criar transação", { description: error.message });
        }
    });

    const updateTx = api.financial.update.useMutation({
        onSuccess: () => {
            utils.financial.getAll.invalidate();
            utils.financial.getSummary.invalidate();
            utils.financial.getDailyMetrics.invalidate();
            setEditOpen(false);
            setEditingTx(null);
        },
        onError: (error) => {
            toast.error("Erro ao atualizar transação", { description: error.message });
        }
    });

    const deleteTx = api.financial.delete.useMutation({
        onSuccess: () => {
            utils.financial.getAll.invalidate();
            utils.financial.getSummary.invalidate();
            utils.financial.getDailyMetrics.invalidate();
        },
    });

    function handleCreate(values: FinancialFormValues) {
        createTx.mutate({
            ...values,
            dueDate: new Date(values.dueDate),
            paymentDate: values.paymentDate ? new Date(values.paymentDate) : undefined,
            type: values.type as any,
            status: values.status as any,
        });
    }

    function handleUpdate(values: FinancialFormValues) {
        if (editingTx) {
            updateTx.mutate({
                id: editingTx.id,
                ...values,
                dueDate: new Date(values.dueDate),
                paymentDate: values.paymentDate ? new Date(values.paymentDate) : undefined,
                type: values.type as any,
                status: values.status as any,
            });
        }
    }

    function handleDelete(id: string) {
        if (window.confirm("Tem certeza que deseja excluir este registro financeiro?")) {
            deleteTx.mutate({ id });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Financeiro (Fluxo de Caixa)</h2>
                {hasPermission("financial", "criar") && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                <Plus className="mr-2 h-4 w-4" /> Nova Transação
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Transação</DialogTitle>
                            </DialogHeader>
                            <FinancialForm
                                onSubmit={handleCreate}
                                isPending={createTx.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Resumo Financeiro */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">A Receber (Pendente)</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold text-sky-500">
                            R$ {summary?.receivablePending.toFixed(2) || "0.00"}
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Receitas (Pagas)</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold text-green-500">
                            R$ {summary?.receivablePaid.toFixed(2) || "0.00"}
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">A Pagar (Pendente)</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold text-orange-500">
                            R$ {summary?.payablePending.toFixed(2) || "0.00"}
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Despesas (Pagas)</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold text-red-500">
                            R$ {summary?.payablePaid.toFixed(2) || "0.00"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Visual */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 rounded-xl border bg-card text-card-foreground shadow p-4">
                    <h3 className="font-semibold mb-4 text-lg">Lucro Bruto vs Fluxo de Caixa Diário (30 dias)</h3>
                    <div className="h-[300px] w-full">
                        {loadingMetrics ? (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">Carregando gráfico...</div>
                        ) : dailyMetrics?.daily && dailyMetrics.daily.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyMetrics.daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(val) => format(new Date(val + "T12:00:00"), "dd/MM", { locale: ptBR })} 
                                        stroke="var(--foreground)" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        stroke="var(--foreground)" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(val) => `R$ ${val}`} 
                                    />
                                    <Tooltip 
                                        formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, ""]}
                                        labelFormatter={(label) => format(new Date(label + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
                                    />
                                    <Legend />
                                    <Bar dataKey="lucroBruto" name="Lucro Bruto (Vendas)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="saldoCaixa" name="Saldo do Caixa (Receitas - Despesas)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem dados para o período.</div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-4 flex flex-col">
                    <h3 className="font-semibold mb-4 text-lg">Métodos de Pagamento (30 dias)</h3>
                    <div className="flex-1 overflow-auto space-y-4">
                        {loadingMetrics ? (
                            <div className="text-center text-muted-foreground py-8">Carregando métodos...</div>
                        ) : Object.keys(dailyMetrics?.paymentMethods || {}).length > 0 ? (
                            Object.entries(dailyMetrics!.paymentMethods).sort((a, b) => (b[1].receitas + b[1].despesas) - (a[1].receitas + a[1].despesas)).map(([method, data]) => (
                                <div key={method} className="space-y-2 border-b last:border-0 pb-3 last:pb-0">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{method}</span>
                                        <span className="font-bold">
                                            R$ {((data.receitas) - (data.despesas)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-500">+ R$ {data.receitas.toFixed(2)}</span>
                                        <span className="text-red-500">- R$ {data.despesas.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">Nenhuma movimentação registrada.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabela de Transações com Filtros */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                        <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                                <SelectItem value="RECEIVABLE">Receita</SelectItem>
                                <SelectItem value="PAYABLE">Despesa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                        <label className="text-xs font-medium text-muted-foreground">Status</label>
                        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos os Status</SelectItem>
                                <SelectItem value="PENDING">Pendente</SelectItem>
                                <SelectItem value="PAID">Pago</SelectItem>
                                <SelectItem value="OVERDUE">Atrasado</SelectItem>
                                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                        <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas as Categorias</SelectItem>
                                <SelectItem value="Materiais">Materiais</SelectItem>
                                <SelectItem value="Salários / Pró-labore">Salários / Pró-labore</SelectItem>
                                <SelectItem value="Aluguel">Aluguel</SelectItem>
                                <SelectItem value="Energia Elétrica">Energia Elétrica</SelectItem>
                                <SelectItem value="Internet / Telefone">Internet / Telefone</SelectItem>
                                <SelectItem value="Impostos">Impostos</SelectItem>
                                <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                                <SelectItem value="Venda de Serviços">Venda de Serviços</SelectItem>
                                <SelectItem value="Comissões">Comissões</SelectItem>
                                <SelectItem value="Manutenção">Manutenção</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1" />

                    {(typeFilter !== "ALL" || statusFilter !== "ALL" || categoryFilter !== "ALL") && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-2 lg:px-3"
                            onClick={() => {
                                setTypeFilter("ALL");
                                setStatusFilter("ALL");
                                setCategoryFilter("ALL");
                                setPage(1);
                            }}
                        >
                            Limpar Filtros
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="rounded-md border bg-card overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Entidade</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-48 animate-pulse bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-32 animate-pulse bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-20 animate-pulse bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-20 animate-pulse bg-muted rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded ml-auto" /></TableCell>
                                    <TableCell><div className="h-8 w-16 animate-pulse bg-muted rounded" /></TableCell>
                                </TableRow>
                            ))
                        ) : transactions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                                    Nenhuma transação financeira encontrada com os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions?.map((tx: any) => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        {format(new Date(tx.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{tx.description}</span>
                                            {tx.category && (
                                                <span className="text-[10px] w-fit text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded mt-1 uppercase font-semibold">
                                                    {tx.category}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate">{tx.entityName || "-"}</TableCell>
                                    <TableCell>
                                        {tx.type === "PAYABLE" ? (
                                            <span className="text-red-500 font-medium text-sm">Despesa</span>
                                        ) : (
                                            <span className="text-green-500 font-medium text-sm">Receita</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {tx.status === "PENDING" && <span className="text-orange-500 text-sm">Pendente</span>}
                                        {tx.status === "PAID" && <span className="text-green-500 text-sm">Pago</span>}
                                        {tx.status === "OVERDUE" && <span className="text-red-600 font-bold text-sm">Atrasado</span>}
                                        {tx.status === "CANCELLED" && <span className="text-zinc-500 line-through text-sm">Cancelado</span>}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${tx.type === "RECEIVABLE" ? "text-green-500" : "text-red-500"}`}>
                                        {tx.type === "PAYABLE" ? "- " : "+ "}
                                        R$ {Number(tx.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {hasPermission("financial", "editar") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        const txFormValues: any = {
                                                            id: tx.id,
                                                            type: tx.type,
                                                            status: tx.status,
                                                            description: tx.description,
                                                            amount: Number(tx.amount),
                                                            dueDate: new Date(tx.dueDate),
                                                            paymentDate: tx.paymentDate ? new Date(tx.paymentDate) : undefined,
                                                            paymentMethod: tx.paymentMethod || undefined,
                                                            category: tx.category || undefined,
                                                            entityName: tx.entityName || undefined,
                                                        };
                                                        setEditingTx(txFormValues);
                                                        setEditOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission("financial", "excluir") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDelete(tx.id)}
                                                    disabled={deleteTx.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between py-4">
                    <p className="text-sm text-muted-foreground italic">
                        Página {page} de {totalPages}
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Próximo
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Transação</DialogTitle>
                    </DialogHeader>
                    {editingTx && (
                        <FinancialForm
                            initialValues={editingTx as any}
                            onSubmit={handleUpdate}
                            isPending={updateTx.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
