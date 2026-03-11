"use client";

import { api } from "@/trpc/react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function LogsClient() {
    const { data: logs, isLoading } = api.order.getLogs.useQuery();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando relatórios de logs...</div>;
    }

    const statusColors = {
        PENDING: "secondary",
        IN_PROGRESS: "default",
        COMPLETED: "outline",
        CANCELLED: "destructive",
    } as const;

    const translateStatus = (st: string | null) => {
        if (!st) return "-";
        switch(st) {
            case "PENDING": return "Pendente";
            case "IN_PROGRESS": return "Em Produção";
            case "COMPLETED": return "Finalizado";
            case "CANCELLED": return "Cancelado";
            default: return st;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Relatório: Logs de Status</h1>
                <p className="text-muted-foreground">Histórico de mudanças em ordens de serviço</p>
            </div>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-lg">Registro de Auditoria</CardTitle>
                </CardHeader>
                <CardContent>
                    {!logs || logs.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            Nenhum log de alteração de status encontrado.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Data/Hora</TableHead>
                                        <TableHead>Ordem</TableHead>
                                        <TableHead>Ação</TableHead>
                                        <TableHead>Usuário Responsável</TableHead>
                                        <TableHead>Criador Original</TableHead>
                                        <TableHead>Mudança de Status</TableHead>
                                        <TableHead className="text-right">Acesso</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="whitespace-nowrap font-medium">
                                                {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                                            </TableCell>
                                            <TableCell>
                                                #{log.orderId.slice(-4).toUpperCase()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-mono">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.user ? (
                                                    <>
                                                        <div className="font-semibold">{log.user.nomeCompleto}</div>
                                                        <div className="text-xs text-muted-foreground">@{log.user.usuario}</div>
                                                    </>
                                                ) : (
                                                    <div className="font-semibold text-muted-foreground italic">Sistema / Admin</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {log.order.creator ? (
                                                    <div className="text-sm">
                                                        {log.order.creator.nomeCompleto}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">Não registrado</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    {log.previousStatus && (
                                                        <>
                                                            <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                                                                {translateStatus(log.previousStatus)}
                                                            </span>
                                                            <span className="text-muted-foreground">→</span>
                                                        </>
                                                    )}
                                                    <Badge variant={log.newStatus ? statusColors[log.newStatus as keyof typeof statusColors] : "outline"}>
                                                        {translateStatus(log.newStatus)}
                                                    </Badge>
                                                </div>
                                                {log.reason && (
                                                    <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[150px]" title={log.reason}>
                                                        {log.reason}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/orders/${log.orderId}`}>
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
