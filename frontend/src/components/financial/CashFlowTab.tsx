"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight, Filter, Wallet, AlertOctagon, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FINANCIAL_CATEGORIES = [
    "MATERIAIS",
    "EQUIPAMENTOS",
    "FUNCIONARIOS",
    "IMPOSTOS",
    "SERVIÇOS",
    "VENDAS",
    "OUTROS"
];

export function CashFlowTab() {
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

    const dateFilters = {
        startDate: startDate ? new Date(startDate + "T00:00:00-03:00") : undefined,
        endDate: endDate ? new Date(endDate + "T23:59:59-03:00") : undefined,
        type: typeFilter !== "ALL" ? typeFilter as any : undefined,
        status: statusFilter !== "ALL" ? statusFilter as any : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    };

    const { data, isLoading } = api.financial.getCashFlow.useQuery(dateFilters);
    const summary = data?.summary;
    const items = data?.items;

    const hasActiveFilters = startDate || endDate || typeFilter !== "ALL" || statusFilter !== "ALL" || categoryFilter !== "ALL";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Dashboard summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-background to-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Inicial (Realizado)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {summary?.initialRealBalance?.toFixed(2) || "0.00"}</div>
                        <p className="text-xs text-muted-foreground mt-1">Saldo base do período</p>
                    </CardContent>
                </Card>
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Total de Entradas</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                            + R$ {summary?.periodEntries?.toFixed(2) || "0.00"}
                        </div>
                        <p className="text-xs text-green-600/70 mt-1">Soma das receitas na tela</p>
                    </CardContent>
                </Card>
                <Card className="border-red-500/20 bg-red-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Total de Saídas</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                            - R$ {summary?.periodExits?.toFixed(2) || "0.00"}
                        </div>
                        <p className="text-xs text-red-600/70 mt-1">Soma das despesas na tela</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Saldo Atualizado (Realizado)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                            R$ {summary?.finalRealBalance?.toFixed(2) || "0.00"}
                        </div>
                        <p className="text-xs text-indigo-600/70 mt-1">
                            Projetado Geral: R$ {summary?.finalProjectedBalance?.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Standard Filter Area */}
            <div className="flex flex-wrap items-center gap-4 bg-muted/40 p-5 rounded-2xl border border-border/50">
                <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Data Mínima</label>
                    <input 
                        type="date" 
                        className="flex h-10 w-full rounded-xl border border-border/40 bg-background/80 px-3 py-2 text-sm backdrop-blur file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:bg-background/40"
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />
                </div>
                <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Data Máxima</label>
                    <input 
                        type="date" 
                        className="flex h-10 w-full rounded-xl border border-border/40 bg-background/80 px-3 py-2 text-sm backdrop-blur file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:bg-background/40"
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                    />
                </div>

                <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Natureza</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="bg-background/80 backdrop-blur rounded-xl border-border/40">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas as Mov.</SelectItem>
                            <SelectItem value="RECEIVABLE">Entradas</SelectItem>
                            <SelectItem value="PAYABLE">Saídas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[160px]">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-background/80 backdrop-blur rounded-xl border-border/40">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos os Status</SelectItem>
                            <SelectItem value="PENDING">Previsto</SelectItem>
                            <SelectItem value="PAID">Liquidado / Pago</SelectItem>
                            <SelectItem value="OVERDUE">Vencido</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[160px]">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Categoria</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="bg-background/80 backdrop-blur rounded-xl border-border/40">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas</SelectItem>
                            {FINANCIAL_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1" />

                {hasActiveFilters && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 px-4 rounded-xl text-xs font-bold uppercase hover:bg-background/50 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                        onClick={() => {
                            setStartDate("");
                            setEndDate("");
                            setTypeFilter("ALL");
                            setStatusFilter("ALL");
                            setCategoryFilter("ALL");
                        }}
                    >
                        <X className="mr-2 h-4 w-4" /> Limpar Filtros
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="py-4 font-bold uppercase tracking-wider text-xs">Data</TableHead>
                            <TableHead className="py-4 font-bold uppercase tracking-wider text-xs">Descrição / Entidade</TableHead>
                            <TableHead className="py-4 font-bold uppercase tracking-wider text-xs">Categoria</TableHead>
                            <TableHead className="py-4 font-bold uppercase tracking-wider text-xs">Status</TableHead>
                            <TableHead className="py-4 font-bold uppercase tracking-wider text-xs text-right">Movimentação</TableHead>
                            <TableHead className="py-4 font-bold uppercase tracking-wider text-xs text-right pr-6">Saldo Realizado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(6)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6} className="py-6"><div className="h-6 w-full animate-pulse bg-muted rounded-xl" /></TableCell>
                                </TableRow>
                            ))
                        ) : items?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                                    Nenhuma movimentação de caixa neste período.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items?.map((tx) => {
                                const isEntry = tx.type === "RECEIVABLE";
                                const isPaid = tx.status === "PAID";
                                const isOverdue = tx.status === "OVERDUE";
                                return (
                                    <TableRow key={tx.id} className={cn("group transition-colors", isOverdue && "bg-amber-500/5")}>
                                        <TableCell className="py-3">
                                            <div className="font-medium text-sm">
                                                {format(new Date(tx.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                                            </div>
                                            {tx.paymentDate && (
                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                    Liq: {format(new Date(tx.paymentDate), "dd/MM/yyyy")}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-sm line-clamp-1">{tx.description}</div>
                                            {tx.entityName && (
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{tx.entityName}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] bg-background">
                                                {tx.category || "N/A"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isPaid ? "default" : isOverdue ? "destructive" : "secondary"} className={cn("text-[10px]", isPaid && "bg-green-500 hover:bg-green-600", isOverdue && "bg-red-500 hover:bg-red-600")}>
                                                {tx.status === "PAID" ? "Liquidado" : tx.status === "OVERDUE" ? "Atrasado" : "Previsto"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-sm">
                                            <span className={cn(isEntry ? "text-green-600" : "text-red-500")}>
                                                {isEntry ? "+" : "-"} R$ {tx.amount.toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-bold text-sm">
                                            <span className={cn(tx.accumulatedReal < 0 ? "text-red-500" : "text-indigo-600")}>
                                                R$ {tx.accumulatedReal.toFixed(2)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
