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
import { Plus, Trash2, Edit, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialForm, MaterialFormValues } from "@/components/materials/MaterialForm";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";

export default function MaterialsPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [entryOpen, setEntryOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<{ id: string } & MaterialFormValues | null>(null);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
    const [quantityToAdd, setQuantityToAdd] = useState<number>(0);
    const [entryNote, setEntryNote] = useState<string>("");
    const utils = api.useUtils();

    const { data: materials, isLoading } = api.material.getAll.useQuery(undefined, {
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

    const entryMutation = api.material.registerEntry.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
            toast.success("Estoque atualizado!");
            setEntryOpen(false);
            setQuantityToAdd(0);
            setEntryNote("");
        },
        onError: (error: any) => {
            console.error("Erro ao registrar entrada:", error);
            toast.error("Erro ao registrar entrada", { description: error.message });
        }
    });

    const createMaterial = api.material.create.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
            toast.success("Material criado!");
            setCreateOpen(false);
        },
        onError: (error: any) => {
            console.error("Erro ao criar material:", error);
            toast.error("Erro ao criar material", { description: error.message });
        }
    });

    const updateMaterial = api.material.update.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
            toast.success("Material atualizado!");
            setEditOpen(false);
            setEditingMaterial(null);
        },
        onError: (error: any) => {
            console.error("Erro ao atualizar material:", error);
            toast.error("Erro ao atualizar material", { description: error.message });
        }
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
                {hasPermission("materials", "criar") && (
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
                )}
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Preço Base</TableHead>
                            <TableHead>Dimen./Vol.</TableHead>
                            <TableHead>Estoque</TableHead>
                            <TableHead>Custo Unitário</TableHead>
                            <TableHead className="w-[120px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : materials?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">Nenhum material cadastrado.</TableCell>
                            </TableRow>
                        ) : (
                            materials?.map((material: any) => (
                                <TableRow key={material.id}>
                                    <TableCell className="font-medium">{material.name}</TableCell>
                                    <TableCell>{material.category === "ADHESIVE" ? "Adesivo" : "Líquido"}</TableCell>
                                    <TableCell>R$ {Number(material.pricePerRoll).toFixed(2)}</TableCell>
                                    <TableCell>
                                        {material.category === "ADHESIVE"
                                            ? `${Number(material.width)}m x ${Number(material.rollLength)}m`
                                            : `${Number(material.volume)}ml`
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${Number(material.stockAmount) < (material.category === 'ADHESIVE' ? 5 : 100) ? 'text-red-500' : 'text-green-600'}`}>
                                            {Number(material.stockAmount).toFixed(2)} {material.category === "ADHESIVE" ? "m²" : "ml"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {material.category === "ADHESIVE"
                                            ? `R$ ${Number(material.costPerSqMeter).toFixed(2)}/m²`
                                            : `R$ ${Number(material.costPerMl).toFixed(2)}/ml`
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {hasPermission("materials", "editar") && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    title="Registrar Entrada"
                                                    onClick={() => {
                                                        setSelectedMaterialId(material.id);
                                                        setEntryOpen(true);
                                                    }}
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission("materials", "editar") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingMaterial({
                                                            id: material.id,
                                                            name: material.name,
                                                            category: material.category as any,
                                                            unit: material.unit as any,
                                                            pricePerRoll: Number(material.pricePerRoll),
                                                            rollLength: Number(material.rollLength),
                                                            width: Number(material.width),
                                                            volume: Number(material.volume),
                                                            stockAmount: Number(material.stockAmount),
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
                                                    onClick={() => handleDelete(material.id)}
                                                    disabled={deleteMaterial.isPending}
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

            <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">
                                Quantidade a adicionar ({materials?.find(m => m.id === selectedMaterialId)?.category === "ADHESIVE" ? "m²" : "ml"})
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={quantityToAdd}
                                onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="note">Observação (Opcional)</Label>
                            <Input
                                id="note"
                                placeholder="Ex: NF-1234, Fornecedor X..."
                                value={entryNote}
                                onChange={(e) => setEntryNote(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            disabled={entryMutation.isPending || quantityToAdd <= 0}
                            onClick={() => {
                                if (selectedMaterialId) {
                                    entryMutation.mutate({
                                        materialId: selectedMaterialId,
                                        quantityAdded: quantityToAdd,
                                        note: entryNote || undefined,
                                    });
                                }
                            }}
                        >
                            {entryMutation.isPending ? "Registrando..." : "Confirmar Entrada"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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
        </div >
    );
}

