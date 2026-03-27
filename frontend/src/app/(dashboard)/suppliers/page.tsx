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
import { Plus, Trash2, Edit, Building2 } from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import { SupplierForm, SupplierFormValues } from "@/components/suppliers/SupplierForm";

// Vamos criar um utilitário para formatar datas, semelhante as outras telas

export default function SuppliersPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<{ id: string } & Partial<SupplierFormValues> | null>(null);
    const utils = api.useUtils();

    const { data: suppliers, isLoading } = api.supplier.getAll.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("materials", "visualizar"),
    });

    if (!loadingPerms && !hasPermission("materials", "visualizar")) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para visualizar este módulo.</p>
            </div>
        );
    }

    const createSupplier = api.supplier.create.useMutation({
        onSuccess: () => {
            utils.supplier.getAll.invalidate();
            setCreateOpen(false);
            toast.success("Fornecedor criado com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao criar fornecedor", { description: error.message });
        }
    });

    const updateSupplier = api.supplier.update.useMutation({
        onSuccess: () => {
            utils.supplier.getAll.invalidate();
            setEditOpen(false);
            setEditingSupplier(null);
            toast.success("Fornecedor atualizado com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao atualizar", { description: error.message });
        }
    });

    const deleteSupplier = api.supplier.delete.useMutation({
        onSuccess: () => {
            utils.supplier.getAll.invalidate();
            toast.success("Fornecedor excluído com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao excluir", { description: error.message });
        }
    });

    function handleDelete(id: string) {
        if (window.confirm("Deseja excluir este fornecedor? Esta ação não pode ser desfeita.")) {
            deleteSupplier.mutate({ id });
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 bg-clip-text text-transparent flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-fuchsia-500" />
                        Fornecedores
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">Cadastre os fornecedores para vincular ao estoque de materiais.</p>
                </div>
                {hasPermission("materials", "criar") && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-lg shadow-fuchsia-500/20 px-6">
                                <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cadastrar Fornecedor</DialogTitle>
                            </DialogHeader>
                            <SupplierForm
                                onSubmit={(data) => createSupplier.mutate(data)}
                                isPending={createSupplier.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="rounded-2xl border bg-card/60 backdrop-blur-sm overflow-hidden shadow-xl shadow-fuchsia-500/5">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-foreground/80 py-4">Fornecedor</TableHead>
                            <TableHead className="font-bold text-foreground/80 py-4">Documento</TableHead>
                            <TableHead className="font-bold text-foreground/80 py-4">Contato</TableHead>
                            <TableHead className="font-bold text-foreground/80 py-4 text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={4} className="py-6"><div className="h-6 w-full animate-pulse bg-muted rounded-xl" /></TableCell>
                                </TableRow>
                            ))
                        ) : suppliers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                                    Nenhum fornecedor cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers?.map((supplier: any) => (
                                <TableRow key={supplier.id} className="group hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-bold text-foreground">{supplier.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{supplier.document || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm text-muted-foreground">
                                            <span>{supplier.phone || "-"}</span>
                                            <span className="text-xs opacity-70">{supplier.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {hasPermission("materials", "editar") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-fuchsia-500 hover:text-fuchsia-600 hover:bg-fuchsia-500/10"
                                                    onClick={() => {
                                                        setEditingSupplier({
                                                            id: supplier.id,
                                                            name: supplier.name,
                                                            document: supplier.document || "",
                                                            email: supplier.email || "",
                                                            phone: supplier.phone || "",
                                                            address: supplier.address || "",
                                                        });
                                                        setEditOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission("materials", "excluir") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                    onClick={() => handleDelete(supplier.id)}
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
                        <DialogTitle>Editar Fornecedor</DialogTitle>
                    </DialogHeader>
                    {editingSupplier && (
                        <SupplierForm
                            initialValues={editingSupplier as any}
                            onSubmit={(data) => updateSupplier.mutate({ id: editingSupplier.id, ...data })}
                            isPending={updateSupplier.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
