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
import { Plus, Trash2, Edit } from "lucide-react";
import { ServiceTypeForm, ServiceTypeFormValues } from "@/components/services/ServiceTypeForm";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";

export default function ServicesPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingService, setEditingService] = useState<{ id: string } & ServiceTypeFormValues | null>(null);
    const utils = api.useUtils();

    const { data: services, isLoading } = api.serviceType.getAll.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("services", "visualizar"),
    });

    if (!loadingPerms && !hasPermission("services", "visualizar")) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para visualizar este módulo.</p>
            </div>
        );
    }

    const createService = api.serviceType.create.useMutation({
        onSuccess: () => {
            utils.serviceType.getAll.invalidate();
            toast.success("Serviço criado com sucesso!");
            setCreateOpen(false);
        },
        onError: (error: any) => {
            console.error("Erro ao criar serviço:", error);
            toast.error("Erro ao criar serviço", { description: error.message });
        }
    });

    const updateService = api.serviceType.update.useMutation({
        onSuccess: () => {
            utils.serviceType.getAll.invalidate();
            toast.success("Serviço atualizado!");
            setEditOpen(false);
            setEditingService(null);
        },
        onError: (error: any) => {
            console.error("Erro ao atualizar serviço:", error);
            toast.error("Erro ao atualizar serviço", { description: error.message });
        }
    });


    const deleteService = api.serviceType.delete.useMutation({
        onSuccess: () => {
            utils.serviceType.getAll.invalidate();
        },
    });

    function handleCreate(values: ServiceTypeFormValues) {
        createService.mutate(values);
    }

    function handleUpdate(values: ServiceTypeFormValues) {
        if (editingService) {
            updateService.mutate({ id: editingService.id, ...values });
        }
    }

    function handleDelete(id: string) {
        if (window.confirm("Tem certeza que deseja excluir este tipo de serviço?")) {
            deleteService.mutate({ id });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Tipos de Serviço</h2>
                {hasPermission("services", "criar") && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Novo Serviço
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Tipo de Serviço</DialogTitle>
                            </DialogHeader>
                            <ServiceTypeForm
                                onSubmit={handleCreate}
                                isPending={createService.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo de Cobrança</TableHead>
                            <TableHead>Preço Padrão</TableHead>
                            <TableHead>Preço Verniz / ML</TableHead>
                            <TableHead className="w-[120px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : services?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Nenhum serviço cadastrado.</TableCell>
                            </TableRow>
                        ) : (
                            services?.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell>
                                        {service.billingType === "FIXED" ? "Fixo" : "Por m²"}
                                    </TableCell>
                                    <TableCell>
                                        {service.defaultPrice
                                            ? `R$ ${Number(service.defaultPrice).toFixed(2)}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {`R$ ${Number((service as any).varnishPricePerMl || 0).toFixed(2)}`}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {hasPermission("services", "editar") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingService({
                                                            id: service.id,
                                                            name: service.name,
                                                            billingType: service.billingType as "FIXED" | "PER_M2",
                                                            defaultPrice: Number(service.defaultPrice),
                                                            varnishPricePerMl: Number((service as any).varnishPricePerMl || 0),
                                                        });
                                                        setEditOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission("services", "excluir") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(service.id)}
                                                    disabled={deleteService.isPending}
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

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Tipo de Serviço</DialogTitle>
                    </DialogHeader>
                    {editingService && (
                        <ServiceTypeForm
                            initialValues={editingService}
                            onSubmit={handleUpdate}
                            isPending={updateService.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

