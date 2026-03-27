"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users, ShieldCheck } from "lucide-react";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { EditUserModal } from "@/components/users/EditUserModal";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";

const perfilBadge: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    GESTOR: "bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-300",
    OPERADOR: "bg-sky-100    text-sky-800    dark:bg-sky-900    dark:text-sky-300",
    CLIENTE: "bg-gray-100   text-gray-800   dark:bg-gray-800   dark:text-gray-300",
};

const statusBadge: Record<string, string> = {
    ATIVO: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    INATIVO: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    BLOQUEADO: "bg-red-100   text-red-800   dark:bg-red-900   dark:text-red-300",
};

export default function UsersPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const [createOpen, setCreateOpen] = useState(false);
    const [editUserId, setEditUserId] = useState<string | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

    const { data: users, isLoading } = api.user.getAll.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("users", "visualizar"),
    });

    const utils = api.useUtils();

    const deleteUser = api.user.delete.useMutation({
        onSuccess: () => { 
            toast.success("Usuário excluído com sucesso!");
            utils.user.getAll.invalidate(); 
            setDeleteUserId(null); 
        },
        onError: (err) => { toast.error("Erro ao excluir usuário", { description: err.message }); },
    });

    const deleteTarget = users?.find((u) => u.id === deleteUserId);

    if (!loadingPerms && !hasPermission("users", "visualizar")) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para visualizar este módulo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
                        <p className="text-sm text-muted-foreground">
                            Gerencie usuários e permissões de acesso ao sistema.
                        </p>
                    </div>
                </div>

                {hasPermission("users", "criar") && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                    Criar Novo Usuário
                                </DialogTitle>
                            </DialogHeader>
                            <CreateUserModal onSuccess={() => setCreateOpen(false)} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Tabela */}
            <div className="rounded-xl border shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Nome</TableHead>
                            <TableHead className="font-semibold hidden sm:table-cell">Usuário</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Perfil</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Módulos com Acesso</TableHead>
                            <TableHead className="font-semibold">Criado em</TableHead>
                            <TableHead className="font-semibold text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>Nenhum usuário cadastrado.</p>
                                    <p className="text-xs mt-1">Clique em <strong>Novo Usuário</strong> para começar.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users?.map((user) => {
                                // Contar módulos com ao menos uma permissão ativa
                                const modulosAtivos = user.permissoes?.filter(
                                    (p) => p.visualizar || p.criar || p.editar || p.excluir
                                ).length ?? 0;

                                return (
                                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 dark:border-indigo-900 shadow-sm">
                                                    {user.nomeCompleto.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">
                                                        {user.nomeCompleto}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground sm:hidden">
                                                        @{user.usuario}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-mono text-primary hidden sm:table-cell">@{user.usuario}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${perfilBadge[user.perfil] ?? ""}`}>
                                                {user.perfil}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[user.status] ?? ""}`}>
                                                {user.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {modulosAtivos > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                    <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                                                    {modulosAtivos} módulo{modulosAtivos !== 1 ? "s" : ""}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/50">Sem acesso</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {hasPermission("users", "editar") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => setEditUserId(user.id)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {hasPermission("users", "excluir") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeleteUserId(user.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editUserId} onOpenChange={(open) => { if (!open) setEditUserId(null); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-primary" />
                            Editar Usuário
                        </DialogTitle>
                    </DialogHeader>
                    {editUserId && (
                        <EditUserModal userId={editUserId} onSuccess={() => setEditUserId(null)} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteUserId} onOpenChange={(open) => { if (!open) setDeleteUserId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir <strong>{deleteTarget?.nomeCompleto}</strong>?
                            Esta ação é irreversível e removerá todas as permissões associadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteUserId && deleteUser.mutate({ id: deleteUserId })}
                            disabled={deleteUser.isPending}
                        >
                            {deleteUser.isPending ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
