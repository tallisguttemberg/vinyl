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
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OrdersPage() {
    const utils = api.useUtils();
    const { data: orders, isLoading } = api.order.getAll.useQuery();

    const deleteOrder = api.order.delete.useMutation({
        onSuccess: () => {
            utils.order.getAll.invalidate();
        },
    });

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta ordem?")) {
            deleteOrder.mutate({ id });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h2>
                <Button asChild>
                    <Link href="/orders/new">
                        <Plus className="mr-2 h-4 w-4" /> Nova Ordem
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Faturamento</TableHead>
                            <TableHead>Lucro</TableHead>
                            <TableHead>Margem</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : orders?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">Nenhuma ordem cadastrada.</TableCell>
                            </TableRow>
                        ) : (
                            orders?.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-medium">{order.customerName}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>R$ {Number(order.totalAmount).toFixed(2)}</TableCell>
                                    <TableCell className="text-green-600 font-medium">R$ {Number(order.profit).toFixed(2)}</TableCell>
                                    <TableCell>{Number(order.margin).toFixed(1)}%</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/orders/${order.id}`}>Ver Detalhes</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/orders/${order.id}/edit`}>Editar</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(order.id)}
                                                >
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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

