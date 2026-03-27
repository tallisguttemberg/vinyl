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
import { 
    Plus, 
    Trash2, 
    Edit, 
    ChevronLeft, 
    ChevronRight, 
    X, 
    CheckCircle2, 
    LayoutDashboard, 
    Wallet, 
    Receipt,
    ArrowRightLeft
} from "lucide-react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { CashFlowTab } from "@/components/financial/CashFlowTab";

const FINANCIAL_CATEGORIES = [
    "Materiais",
    "Salários / Pró-labore",
    "Aluguel",
    "Energia Elétrica",
    "Internet / Telefone",
    "Impostos",
    "Equipamentos",
    "Venda de Serviços",
    "Comissões",
    "Manutenção",
    "Outro",
] as const;

const normalizeDate = (d: string | Date | null | undefined): Date | undefined => {
    if (!d) return undefined;
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return undefined;
    return new Date(`${dateObj.toISOString().split('T')[0]}T12:00:00`);
};

export default function FinancialPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const [activeTab, setActiveTab] = useState<"RECEIVABLE" | "PAYABLE" | "METRICS" | "CASH_FLOW">("RECEIVABLE");
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<{ id: string } & Partial<FinancialFormValues> | null>(null);
    const utils = api.useUtils();
    
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");



    const { data: dailyMetrics, isLoading: loadingMetrics } = api.financial.getDailyMetrics.useQuery({ days: 30 }, {
        enabled: !loadingPerms && hasPermission("financial", "visualizar"),
    });

    const { data: transactionsData, isLoading } = api.financial.getAll.useQuery({
        page,
        type: (activeTab !== "METRICS" && activeTab !== "CASH_FLOW") ? activeTab : undefined,
        status: statusFilter !== "ALL" ? statusFilter as any : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        startDate: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
        endDate: endDate ? new Date(`${endDate}T23:59:59`) : undefined,
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
            utils.financial.getDailyMetrics.invalidate();
            setCreateOpen(false);
            toast.success("Transação criada com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao criar transação", { description: error.message });
        }
    });

    const updateTx = api.financial.update.useMutation({
        onSuccess: () => {
            utils.financial.getAll.invalidate();
            utils.financial.getDailyMetrics.invalidate();
            setEditOpen(false);
            setEditingTx(null);
            toast.success("Transação atualizada com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao atualizar transação", { description: error.message });
        }
    });

    const deleteTx = api.financial.delete.useMutation({
        onSuccess: () => {
            utils.financial.getAll.invalidate();
            utils.financial.getDailyMetrics.invalidate();
            toast.success("Registro excluído!");
        },
        onError: (error) => {
            toast.error("Erro ao excluir registro", { description: error.message });
        }
    });

    function handleCreate(values: FinancialFormValues) {
        createTx.mutate({
            ...values,
            dueDate: new Date(`${values.dueDate}T12:00:00`),
            paymentDate: values.paymentDate ? new Date(`${values.paymentDate}T12:00:00`) : undefined,
            type: values.type as any,
            status: values.status as any,
        });
    }

    function handleUpdate(values: FinancialFormValues) {
        if (editingTx) {
            updateTx.mutate({
                id: editingTx.id,
                ...values,
                dueDate: new Date(`${values.dueDate}T12:00:00`),
                paymentDate: values.paymentDate ? new Date(`${values.paymentDate}T12:00:00`) : undefined,
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

    function handleQuickMarkAsPaid(id: string) {
        updateTx.mutate({
            id,
            status: "PAID",
            paymentDate: new Date(),
        });
    }



    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                        Financeiro do Sistema
                    </h2>

                </div>
                {hasPermission("financial", "criar") && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
                                <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Registro Financeiro</DialogTitle>
                            </DialogHeader>
                            <FinancialForm
                                onSubmit={handleCreate}
                                isPending={createTx.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Premium Tabs Selection */}
            <div className="flex bg-muted/30 p-1 rounded-xl w-fit max-w-full overflow-x-auto">
                <button
                    onClick={() => { setActiveTab("RECEIVABLE"); setPage(1); }}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300",
                        activeTab === "RECEIVABLE" 
                            ? "bg-green-500/10 text-green-500 shadow-sm" 
                            : "text-muted-foreground hover:bg-muted/50"
                    )}
                >
                    <Wallet className={cn("h-4 w-4", activeTab === "RECEIVABLE" && "animate-pulse")} />
                    Contas a Receber
                </button>
                <button
                    onClick={() => { setActiveTab("PAYABLE"); setPage(1); }}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300",
                        activeTab === "PAYABLE" 
                            ? "bg-red-500/10 text-red-500 shadow-sm" 
                            : "text-muted-foreground hover:bg-muted/50"
                    )}
                >
                    <Receipt className="h-4 w-4" />
                    Contas a Pagar
                </button>
                <button
                    onClick={() => { setActiveTab("METRICS"); setPage(1); }}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300",
                        activeTab === "METRICS" 
                            ? "bg-sky-500/10 text-sky-500 shadow-sm" 
                            : "text-muted-foreground hover:bg-muted/50"
                    )}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Fluxo e Métricas
                </button>
                <button
                    onClick={() => { setActiveTab("CASH_FLOW"); setPage(1); }}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300",
                        activeTab === "CASH_FLOW" 
                            ? "bg-indigo-500/10 text-indigo-500 shadow-sm" 
                            : "text-muted-foreground hover:bg-muted/50"
                    )}
                >
                    <ArrowRightLeft className="h-4 w-4" />
                    Visão Gerencial (DRE/CDF)
                </button>
            </div>



            {activeTab === "CASH_FLOW" ? (
                <CashFlowTab />
            ) : activeTab === "METRICS" ? (
                /* Dashboard Visual */
                <div className="grid gap-6 md:grid-cols-3 animate-in zoom-in-95 duration-500">
                    <div className="md:col-span-2 rounded-2xl border bg-card shadow-lg p-6 hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <LayoutDashboard className="h-5 w-5 text-indigo-500" />
                                Saúde Financeira (30 dias)
                            </h3>
                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tighter">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-500 rounded" /> Lucro Bruto</div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded" /> Saldo Caixa</div>
                            </div>
                        </div>
                        <div className="h-[350px] w-full mt-4">
                            {loadingMetrics ? (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse">Carregando métricas...</div>
                            ) : dailyMetrics?.daily && dailyMetrics.daily.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyMetrics.daily} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--border)" opacity={0.4} />
                                        <XAxis 
                                            dataKey="date" 
                                            tickFormatter={(val) => format(new Date(val + "T12:00:00"), "dd/MM", { locale: ptBR })} 
                                            stroke="var(--foreground)" 
                                            fontSize={11} 
                                            tickLine={false} 
                                            axisLine={false} 
                                        />
                                        <YAxis 
                                            stroke="var(--foreground)" 
                                            fontSize={11} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tickFormatter={(val) => `R$ ${val}`} 
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                            formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, ""]}
                                            labelFormatter={(label) => format(new Date(label + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                                            contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--background)", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                                        />
                                        <Bar dataKey="lucroBruto" name="Lucro" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
                                        <Bar dataKey="saldoCaixa" name="Saldo" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem dados para o período selecionado.</div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card shadow-lg p-6 flex flex-col hover:border-indigo-500/30 transition-colors">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                             <Wallet className="h-5 w-5 text-indigo-500" />
                             Métodos Favoritos
                        </h3>
                        <div className="flex-1 overflow-auto space-y-6">
                            {loadingMetrics ? (
                                <div className="text-center text-muted-foreground py-12 animate-spin"><LayoutDashboard className="h-8 w-8 mx-auto opacity-20" /></div>
                            ) : Object.keys(dailyMetrics?.paymentMethods || {}).length > 0 ? (
                                Object.entries(dailyMetrics!.paymentMethods).sort((a, b) => (b[1].receitas + b[1].despesas) - (a[1].receitas + a[1].despesas)).map(([method, data]) => (
                                    <div key={method} className="space-y-3 group">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-foreground/80">{method}</span>
                                            <span className={cn(
                                                "font-black px-2 py-1 rounded text-xs tracking-tight",
                                                (data.receitas - data.despesas) >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                R$ {((data.receitas) - (data.despesas)).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-green-500 h-full inline-block transition-all duration-1000" 
                                                style={{ width: `${(data.receitas / (data.receitas + data.despesas || 1)) * 100}%` }} 
                                            />
                                            <div 
                                                className="bg-red-500 h-full inline-block transition-all duration-1000" 
                                                style={{ width: `${(data.despesas / (data.receitas + data.despesas || 1)) * 100}%` }} 
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-12 italic">Crie transações para ver as métricas.</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Tabela de Transações (Pagar ou Receber) */
                <div className="space-y-6 animate-in fade-in duration-700">
                    <div className="flex flex-wrap items-center gap-4 bg-muted/40 p-5 rounded-2xl border border-border/50">
                        <div className="flex flex-col gap-1.5 min-w-[180px]">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Status</label>
                            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                                <SelectTrigger className="bg-background/80 backdrop-blur rounded-xl border-border/40">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos os Status</SelectItem>
                                    <SelectItem value="PENDING">Pendente</SelectItem>
                                    <SelectItem value="PAID">Pago / Liquidado</SelectItem>
                                    <SelectItem value="OVERDUE">Atrasado</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Categoria</label>
                            <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
                                <SelectTrigger className="bg-background/80 backdrop-blur rounded-xl border-border/40">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todas as Categorias</SelectItem>
                                    {FINANCIAL_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Data Mínima</label>
                            <input 
                                type="date" 
                                className="flex h-10 w-full rounded-xl border border-border/40 bg-background/80 px-3 py-2 text-sm backdrop-blur file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:bg-background/40"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Data Máxima</label>
                            <input 
                                type="date" 
                                className="flex h-10 w-full rounded-xl border border-border/40 bg-background/80 px-3 py-2 text-sm backdrop-blur file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:bg-background/40"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            />
                        </div>

                        <div className="flex-1" />

                        {(statusFilter !== "ALL" || categoryFilter !== "ALL" || startDate || endDate) && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-10 px-4 rounded-xl text-xs font-bold uppercase hover:bg-background/50 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                                onClick={() => {
                                    setStatusFilter("ALL");
                                    setCategoryFilter("ALL");
                                    setStartDate("");
                                    setEndDate("");
                                    setPage(1);
                                }}
                            >
                                <X className="mr-2 h-4 w-4" /> Limpar Filtros
                            </Button>
                        )}
                    </div>

                    <div className="rounded-2xl border bg-card/60 backdrop-blur-sm overflow-hidden shadow-xl shadow-indigo-500/5">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold text-foreground/80 py-4">Vencimento</TableHead>
                                    <TableHead className="font-bold text-foreground/80 py-4">Descrição</TableHead>
                                    <TableHead className="font-bold text-foreground/80 py-4">Entidade</TableHead>
                                    <TableHead className="font-bold text-foreground/80 py-4">Status</TableHead>
                                    <TableHead className="font-bold text-foreground/80 py-4 text-right pr-6">Valor</TableHead>
                                    <TableHead className="font-bold text-foreground/80 py-4 text-center">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(6)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={6} className="py-6"><div className="h-6 w-full animate-pulse bg-muted rounded-xl" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : transactions?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                                            Nenhum lançamento encontrado nesta aba.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions?.map((tx: any) => (
                                        <TableRow key={tx.id} className="group hover:bg-muted/20 transition-colors">
                                            <TableCell className={cn(
                                                "font-semibold", 
                                                normalizeDate(tx.dueDate)! < new Date() && tx.status === 'PENDING' ? "text-red-500" : "text-muted-foreground"
                                            )}>
                                                {format(normalizeDate(tx.dueDate)!, "dd/MM/yyyy", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground group-hover:text-indigo-500 transition-colors uppercase tracking-tighter text-sm">{tx.description}</span>
                                                    {tx.category && (
                                                        <span className="text-[9px] w-fit font-black bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded-full mt-1 uppercase">
                                                            {tx.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate text-muted-foreground font-medium">{tx.entityName || "-"}</TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    const isOverdue = tx.status === "OVERDUE" || (tx.status === "PENDING" && normalizeDate(tx.dueDate)! < today);
                                                    const isPending = tx.status === "PENDING" && !isOverdue;
                                                    
                                                    return (
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                            tx.status === "PAID" && "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
                                                            isPending && "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
                                                            isOverdue && "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800",
                                                            tx.status === "CANCELLED" && "bg-zinc-200 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700"
                                                        )}>
                                                            {isPending && "Pendente"}
                                                            {tx.status === "PAID" && (activeTab === "RECEIVABLE" ? "Recebido" : "Liquidado")}
                                                            {isOverdue && "Atrasado"}
                                                            {tx.status === "CANCELLED" && "Cancelado"}
                                                        </span>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell className={cn(
                                                "text-right font-black text-lg pr-6", 
                                                tx.type === "RECEIVABLE" ? "text-green-500" : "text-foreground"
                                            )}>
                                                {tx.type === "PAYABLE" ? "- " : "+ "}
                                                R$ {Number(tx.amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {tx.status !== 'PAID' && hasPermission("financial", "editar") && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Dar Baixa (Marcar como Pago)"
                                                            className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                            onClick={() => {
                                                                setEditingTx({
                                                                    id: tx.id,
                                                                    type: tx.type,
                                                                    status: "PAID",
                                                                    description: tx.description,
                                                                    amount: Number(tx.amount),
                                                                    dueDate: normalizeDate(tx.dueDate)!,
                                                                    paymentDate: new Date(),
                                                                    paymentMethod: tx.paymentMethod || undefined,
                                                                    category: tx.category || undefined,
                                                                    entityName: tx.entityName || undefined,
                                                                } as any);
                                                                setEditOpen(true);
                                                            }}
                                                        >
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-500/10"
                                                        onClick={() => {
                                                            setEditingTx({
                                                                id: tx.id,
                                                                type: tx.type,
                                                                status: tx.status,
                                                                description: tx.description,
                                                                amount: Number(tx.amount),
                                                                dueDate: normalizeDate(tx.dueDate)!,
                                                                paymentDate: tx.paymentDate ? normalizeDate(tx.paymentDate) : undefined,
                                                                paymentMethod: tx.paymentMethod || undefined,
                                                                category: tx.category || undefined,
                                                                entityName: tx.entityName || undefined,
                                                            } as any);
                                                            setEditOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-500/10"
                                                        onClick={() => handleDelete(tx.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-card p-4 rounded-2xl border">
                            <p className="text-xs font-bold text-muted-foreground uppercase opacity-50">
                                Página {page} de {totalPages}
                            </p>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-border/40 font-bold text-xs"
                                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-border/40 font-bold text-xs"
                                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                                    disabled={page === totalPages}
                                >
                                    Próximo <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Lançamento</DialogTitle>
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
