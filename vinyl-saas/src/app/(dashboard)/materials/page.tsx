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
import { MaterialForm, MaterialFormValues } from "@/components/materials/MaterialForm";

export default function MaterialsPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<{ id: string } & MaterialFormValues | null>(null);
    const utils = api.useUtils();

    const { data: materials, isLoading } = api.material.getAll.useQuery();

    const createMaterial = api.material.create.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
            setCreateOpen(false);
        },
    });

    const updateMaterial = api.material.update.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
            setEditOpen(false);
            setEditingMaterial(null);
        },
    });

    const deleteMaterial = api.material.delete.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
        },
    });

    function handleCreate(values: MaterialFormValues) {
        createMaterial.mutate(values);
    }

    function handleUpdate(values: MaterialFormValues) {
        if (editingMaterial) {
            updateMaterial.mutate({ id: editingMaterial.id, ...values });
        }
    }

    function handleDelete(id: string) {
        if (window.confirm("Tem certeza que deseja excluir este material?")) {
            deleteMaterial.mutate({ id });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Materiais</h2>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Material
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Material</DialogTitle>
                        </DialogHeader>
                        <MaterialForm
                            onSubmit={handleCreate}
                            isPending={createMaterial.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Preço Bobina</TableHead>
                            <TableHead>Dimensões</TableHead>
                            <TableHead>Custo Linear/m</TableHead>
                            <TableHead>Custo m²</TableHead>
                            <TableHead className="w-[120px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : materials?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Nenhum material cadastrado.</TableCell>
                            </TableRow>
                        ) : (
                            materials?.map((material) => (
                                <TableRow key={material.id}>
                                    <TableCell className="font-medium">{material.name}</TableCell>
                                    <TableCell>R$ {Number(material.pricePerRoll).toFixed(2)}</TableCell>
                                    <TableCell>{Number(material.width)}m x {Number(material.rollLength)}m</TableCell>
                                    <TableCell>R$ {Number(material.costPerLinearMeter).toFixed(2)}</TableCell>
                                    <TableCell>R$ {Number(material.costPerSqMeter).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setEditingMaterial({
                                                        id: material.id,
                                                        name: material.name,
                                                        pricePerRoll: Number(material.pricePerRoll),
                                                        rollLength: Number(material.rollLength),
                                                        width: Number(material.width),
                                                    });
                                                    setEditOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(material.id)}
                                                disabled={deleteMaterial.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
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
                        <DialogTitle>Editar Material</DialogTitle>
                    </DialogHeader>
                    {editingMaterial && (
                        <MaterialForm
                            initialValues={editingMaterial}
                            onSubmit={handleUpdate}
                            isPending={updateMaterial.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

