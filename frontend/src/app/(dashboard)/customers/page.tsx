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
import { Plus, Trash2, Edit, Contact } from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import { CustomerForm, CustomerFormValues } from "@/components/customers/CustomerForm";

export default function CustomersPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<{ id: string } & Partial<CustomerFormValues> | null>(null);
    const utils = api.useUtils();

    const { data: customers, isLoading } = api.customer.getAll.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("orders", "visualizar"),
    });

    if (!loadingPerms && !hasPermission("orders", "visualizar")) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para visualizar este módulo.</p>
            </div>
        );
    }

    const createCustomer = api.customer.create.useMutation({
        onSuccess: () => {
            utils.customer.getAll.invalidate();
            setCreateOpen(false);
            toast.success("Cliente criado com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao criar cliente", { description: error.message });
        }
    });

    const updateCustomer = api.customer.update.useMutation({
        onSuccess: () => {
            utils.customer.getAll.invalidate();
            setEditOpen(false);
            setEditingCustomer(null);
            toast.success("Cliente atualizado com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao atualizar", { description: error.message });
        }
    });

    const deleteCustomer = api.customer.delete.useMutation({
        onSuccess: () => {
            utils.customer.getAll.invalidate();
            toast.success("Cliente excluído com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao excluir", { description: error.message });
        }
    });

    function handleDelete(id: string) {
        if (window.confirm("Deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
            deleteCustomer.mutate({ id });
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                        <Contact className="h-8 w-8 text-blue-500" />
                        Clientes
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">Gerencie o cadastro de seus clientes e parceiros.</p>
                </div>
                {hasPermission("orders", "criar") && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6">
                                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cadastrar Cliente</DialogTitle>
                            </DialogHeader>
                            <CustomerForm
                                onSubmit={(data) => createCustomer.mutate(data)}
                                isPending={createCustomer.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="rounded-2xl border bg-card/60 backdrop-blur-sm overflow-hidden shadow-xl shadow-blue-500/5">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-foreground/80 py-4">Cliente</TableHead>
                            <TableHead className="font-bold text-foreground/80 py-4">Documento</TableHead>
                            <TableHead className="font-bold text-foreground/80 py-4">Contato</TableHead>
                            <TableHead className="font-bold text-foreground/80 py-4">Endereço</TableHead>
                            <TableHead className="font-bold text-foreground/80 py-4 text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="py-6"><div className="h-6 w-full animate-pulse bg-muted rounded-xl" /></TableCell>
                                </TableRow>
                            ))
                        ) : customers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                    Nenhum cliente cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers?.map((customer: any) => (
                                <TableRow key={customer.id} className="group hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-bold text-foreground">{customer.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{customer.document || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm text-muted-foreground">
                                            <span>{customer.phone || "-"}</span>
                                            <span className="text-xs opacity-70">{customer.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{customer.address || "-"}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {hasPermission("orders", "editar") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                    onClick={() => {
                                                        setEditingCustomer({
                                                            id: customer.id,
                                                            name: customer.name,
                                                            document: customer.document || "",
                                                            email: customer.email || "",
                                                            phone: customer.phone || "",
                                                            address: customer.address || "",
                                                        });
                                                        setEditOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission("orders", "excluir") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                    onClick={() => handleDelete(customer.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                    </DialogHeader>
                    {editingCustomer && (
                        <CustomerForm
                            initialValues={editingCustomer as any}
                            onSubmit={(data) => updateCustomer.mutate({ id: editingCustomer.id, ...data })}
                            isPending={updateCustomer.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
