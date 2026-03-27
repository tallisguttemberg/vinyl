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
import { SupplyForm, SupplyFormValues } from "@/components/materials/SupplyForm";
import { EquipmentForm, EquipmentFormValues } from "@/components/materials/EquipmentForm";
import { PurchaseFields } from "@/components/materials/PurchaseFields";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaterialsPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [entryOpen, setEntryOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<{ id: string } & MaterialFormValues | null>(null);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
    const [quantityToAdd, setQuantityToAdd] = useState<number>(0);
    const [entryNote, setEntryNote] = useState<string>("");
    const [entryPurchase, setEntryPurchase] = useState({ totalPaid: 0, paymentMethod: "", paymentDate: new Date().toISOString().split("T")[0] });

    // Supplies state
    const [supplyCreateOpen, setSupplyCreateOpen] = useState(false);
    const [supplyEditOpen, setSupplyEditOpen] = useState(false);
    const [editingSupply, setEditingSupply] = useState<{ id: string } & SupplyFormValues | null>(null);

    // Equipment state
    const [equipCreateOpen, setEquipCreateOpen] = useState(false);
    const [equipEditOpen, setEquipEditOpen] = useState(false);
    const [editingEquip, setEditingEquip] = useState<{ id: string } & EquipmentFormValues | null>(null);

    const utils = api.useUtils();

    // Queries
    const { data: materials, isLoading: loadingMaterials } = api.material.getAll.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("materials", "visualizar"),
    });

    const { data: supplies, isLoading: loadingSupplies } = api.supply.getAll.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("materials", "visualizar"),
    });

    const { data: suppliersData } = api.supplier.getAll.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("materials", "visualizar"),
    });

    const { data: equipment, isLoading: loadingEquip } = api.equipment.getAll.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("materials", "visualizar"),
    });

    // Mutations - Materials
    const createMaterial = api.material.create.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
            utils.financial.getAll.invalidate();
            toast.success("Material criado com sucesso!");
            setCreateOpen(false);
        },
        onError: (err) => toast.error(err.message),
    });
    const updateMaterial = api.material.update.useMutation({
        onSuccess: () => { utils.material.getAll.invalidate(); toast.success("Material atualizado!"); setEditOpen(false); },
    });
    const deleteMaterial = api.material.delete.useMutation({
        onSuccess: () => { utils.material.getAll.invalidate(); toast.success("Material excluído!"); },
    });
    const entryMutation = api.material.registerEntry.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
            utils.financial.getAll.invalidate();
            toast.success("Estoque atualizado e despesa lançada no financeiro!");
            setEntryOpen(false);
            setQuantityToAdd(0);
            setEntryNote("");
            setSelectedSupplierId("");
            setEntryPurchase({ totalPaid: 0, paymentMethod: "", paymentDate: new Date().toISOString().split("T")[0] });
        },
        onError: (err) => toast.error(err.message),
    });

    // Mutations - Supplies
    const createSupply = api.supply.create.useMutation({
        onSuccess: () => {
            utils.supply.getAll.invalidate();
            utils.financial.getAll.invalidate();
            toast.success("Insumo criado e despesa lançada no financeiro!");
            setSupplyCreateOpen(false);
        },
        onError: (err) => toast.error(err.message),
    });
    const updateSupply = api.supply.update.useMutation({
        onSuccess: () => { utils.supply.getAll.invalidate(); toast.success("Insumo atualizado!"); setSupplyEditOpen(false); },
    });
    const deleteSupply = api.supply.delete.useMutation({
        onSuccess: () => { utils.supply.getAll.invalidate(); toast.success("Insumo excluído!"); },
    });

    // Mutations - Equipment
    const createEquip = api.equipment.create.useMutation({
        onSuccess: () => {
            utils.equipment.getAll.invalidate();
            utils.financial.getAll.invalidate();
            toast.success("Equipamento criado e despesa lançada!");
            setEquipCreateOpen(false);
        },
        onError: (err) => toast.error(err.message),
    });
    const updateEquip = api.equipment.update.useMutation({
        onSuccess: () => { utils.equipment.getAll.invalidate(); toast.success("Equipamento atualizado!"); setEquipEditOpen(false); },
    });
    const deleteEquip = api.equipment.delete.useMutation({
        onSuccess: () => { utils.equipment.getAll.invalidate(); toast.success("Equipamento excluído!"); },
    });

    if (!loadingPerms && !hasPermission("materials", "visualizar")) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para visualizar este módulo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* ─── SECTION: PRINCIPAL MATERIALS ───────────────────────────────── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Materiais Principais</h2>
                        <p className="text-muted-foreground">Vinil, Adesivos e Materiais com controle de estoque m²/ml.</p>
                    </div>
                    {hasPermission("materials", "criar") && (
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> Novo Material</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Adicionar Material</DialogTitle></DialogHeader>
                                <MaterialForm onSubmit={(v) => createMaterial.mutate(v as any)} isPending={createMaterial.isPending} suppliers={suppliersData || []} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Preço Base</TableHead>
                                    <TableHead>Estoque</TableHead>
                                    <TableHead>Custo Unit.</TableHead>
                                    <TableHead className="w-[120px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingMaterials ? (
                                    <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow>
                                ) : materials?.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center">Nenhum material.</TableCell></TableRow>
                                ) : (
                                    materials?.map((m: any) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="font-medium">{m.name}</TableCell>
                                            <TableCell>{m.category === "ADHESIVE" ? "Adesivo" : "Líquido"}</TableCell>
                                            <TableCell>R$ {Number(m.pricePerRoll).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <span className={`font-semibold ${Number(m.stockAmount) < (m.category === 'ADHESIVE' ? 5 : 100) ? 'text-red-500' : 'text-green-600'}`}>
                                                    {Number(m.stockAmount).toFixed(1)} {m.category === "ADHESIVE" ? "m²" : "ml"}
                                                </span>
                                            </TableCell>
                                            <TableCell>R$ {Number(m.category === "ADHESIVE" ? m.costPerSqMeter : m.costPerMl).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedMaterialId(m.id); setEntryOpen(true); }}><History className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingMaterial({ id: m.id, name: m.name, category: m.category, unit: m.unit, pricePerRoll: Number(m.pricePerRoll), rollLength: Number(m.rollLength), width: Number(m.width), volume: Number(m.volume), stockAmount: Number(m.stockAmount), supplierId: m.supplierId || "" }); setEditOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { if(confirm("Excluir?")) deleteMaterial.mutate({id: m.id}) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* ─── SECTION: SUPPLIES (INSUMOS) ────────────────────────────────── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Insumos (Extras)</h2>
                        <p className="text-muted-foreground">Verniz, rolo, fita, etc. Cobrados por área ou unidade.</p>
                    </div>
                    {hasPermission("materials", "criar") && (
                        <Dialog open={supplyCreateOpen} onOpenChange={setSupplyCreateOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Novo Insumo</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Adicionar Insumo</DialogTitle></DialogHeader>
                                <SupplyForm onSubmit={(v) => createSupply.mutate(v as any)} isPending={createSupply.isPending} suppliers={suppliersData || []} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Unidade</TableHead>
                                    <TableHead>Custo Unit.</TableHead>
                                    <TableHead className="w-[100px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingSupplies ? (
                                    <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
                                ) : supplies?.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center">Nenhum insumo.</TableCell></TableRow>
                                ) : (
                                    supplies?.map((s: any) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.name}</TableCell>
                                            <TableCell>{s.unit}</TableCell>
                                            <TableCell>R$ {Number(s.unitCost).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingSupply({ id: s.id, name: s.name, unit: s.unit, unitCost: Number(s.unitCost), supplierId: s.supplierId }); setSupplyEditOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { if(confirm("Excluir?")) deleteSupply.mutate({id: s.id}) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* ─── SECTION: EQUIPMENT ─────────────────────────────────────────── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Equipamentos</h2>
                        <p className="text-muted-foreground">Andaimes, escadas, sopradores, etc. Cobrados por diária.</p>
                    </div>
                    {hasPermission("materials", "criar") && (
                        <Dialog open={equipCreateOpen} onOpenChange={setEquipCreateOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Novo Equipamento</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Adicionar Equipamento</DialogTitle></DialogHeader>
                                <EquipmentForm onSubmit={(v) => createEquip.mutate(v as any)} isPending={createEquip.isPending} suppliers={suppliersData || []} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Custo Diária</TableHead>
                                    <TableHead className="w-[100px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingEquip ? (
                                    <TableRow><TableCell colSpan={3} className="text-center">Carregando...</TableCell></TableRow>
                                ) : equipment?.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="text-center">Nenhum equipamento.</TableCell></TableRow>
                                ) : (
                                    equipment?.map((e: any) => (
                                        <TableRow key={e.id}>
                                            <TableCell className="font-medium">{e.name}</TableCell>
                                            <TableCell>R$ {Number(e.dailyCost).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingEquip({ id: e.id, name: e.name, dailyCost: Number(e.dailyCost), supplierId: e.supplierId }); setEquipEditOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { if(confirm("Excluir?")) deleteEquip.mutate({id: e.id}) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs for Editing Supplies/Equip */}
            <Dialog open={supplyEditOpen} onOpenChange={setSupplyEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Editar Insumo</DialogTitle></DialogHeader>
                    {editingSupply && <SupplyForm isEdit initialValues={editingSupply} onSubmit={(v) => updateSupply.mutate({ id: editingSupply.id, ...v })} isPending={updateSupply.isPending} suppliers={suppliersData || []} />}
                </DialogContent>
            </Dialog>

            <Dialog open={equipEditOpen} onOpenChange={setEquipEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Editar Equipamento</DialogTitle></DialogHeader>
                    {editingEquip && <EquipmentForm isEdit initialValues={editingEquip} onSubmit={(v) => updateEquip.mutate({ id: editingEquip.id, ...v })} isPending={updateEquip.isPending} suppliers={suppliersData || []} />}
                </DialogContent>
            </Dialog>

            <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Registrar Entrada de Estoque</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplierId">Fornecedor (Obrigatório)</Label>
                            <select 
                                id="supplierId" 
                                className="flex h-10 w-full rounded-xl border border-border/40 bg-background/80 px-3 py-2 text-sm backdrop-blur file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:bg-background/40"
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(e.target.value)}
                            >
                                <option value="" disabled>Selecione um fornecedor...</option>
                                {suppliersData?.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} {s.document ? `(${s.document})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">
                                Quantidade a adicionar ({materials?.find((m: any) => m.id === selectedMaterialId)?.category === "ADHESIVE" ? "m²" : "ml"})
                            </Label>
                            <Input 
                                id="quantity" 
                                type="number" 
                                step="0.01" 
                                value={quantityToAdd} 
                                onChange={(e) => setQuantityToAdd(Number(e.target.value))} 
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="note">Observação</Label>
                            <Input
                                id="note"
                                value={entryNote}
                                onChange={(e) => setEntryNote(e.target.value)}
                                placeholder="Ex: NF 123"
                            />
                        </div>
                        <PurchaseFields value={entryPurchase} onChange={setEntryPurchase} />
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={entryMutation.isPending}
                            onClick={() => {
                                if (!selectedMaterialId) return;
                                if (!selectedSupplierId) { toast.error("Selecione um fornecedor."); return; }
                                if (quantityToAdd <= 0) { toast.error("A quantidade deve ser maior que zero."); return; }
                                if (!entryPurchase.totalPaid || entryPurchase.totalPaid <= 0) { toast.error("Informe o valor total pago."); return; }
                                if (!entryPurchase.paymentMethod) { toast.error("Selecione o método de pagamento."); return; }
                                entryMutation.mutate({
                                    materialId: selectedMaterialId,
                                    supplierId: selectedSupplierId,
                                    quantityAdded: quantityToAdd,
                                    note: entryNote || undefined,
                                    purchase: entryPurchase,
                                });
                            }}
                        >
                            {entryMutation.isPending ? "Registrando..." : "Confirmar Entrada"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Editar Material</DialogTitle></DialogHeader>
                    {editingMaterial && <MaterialForm isEdit initialValues={editingMaterial} onSubmit={(v) => updateMaterial.mutate({ id: editingMaterial.id, ...v })} isPending={updateMaterial.isPending} suppliers={suppliersData || []} />}
                </DialogContent>
            </Dialog>
        </div >
    );
}

