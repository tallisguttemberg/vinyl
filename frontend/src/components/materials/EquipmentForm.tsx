"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { toast } from "sonner";
import { PurchaseFields, PurchaseData } from "@/components/materials/PurchaseFields";
import { format } from "date-fns";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const equipmentSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    dailyCost: z.coerce.number().min(0, "Custo deve ser positivo"),
    supplierId: z.string().min(1, "Fornecedor é obrigatório"),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
    initialValues?: EquipmentFormValues;
    onSubmit: (values: EquipmentFormValues & { purchase?: PurchaseData }) => void;
    isPending?: boolean;
    suppliers: any[];
    isEdit?: boolean;
}

export function EquipmentForm({ initialValues, onSubmit, isPending, suppliers, isEdit }: EquipmentFormProps) {
    const [supplierModalOpen, setSupplierModalOpen] = useState(false);
    const [purchaseData, setPurchaseData] = useState<PurchaseData>({
        totalPaid: 0,
        paymentMethod: "",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
    });
    const utils = api.useUtils();
    const createSupplier = api.supplier.create.useMutation({
        onSuccess: (data) => {
            utils.supplier.getAll.invalidate();
            toast.success("Fornecedor criado!");
            setSupplierModalOpen(false);
            form.setValue("supplierId", data.id);
        },
        onError: (err) => {
            toast.error("Erro ao criar fornecedor", { description: err.message });
        }
    });

    const form = useForm<EquipmentFormValues>({
        resolver: zodResolver(equipmentSchema) as any,
        defaultValues: initialValues ?? {
            name: "",
            dailyCost: 0,
            supplierId: "",
        },
    });

    function handleSubmit(values: EquipmentFormValues) {
        if (!isEdit) {
            if (!purchaseData.totalPaid || purchaseData.totalPaid <= 0) {
                toast.error("Informe o valor total pago pela aquisição.");
                return;
            }
            if (!purchaseData.paymentMethod) {
                toast.error("Selecione o método de pagamento.");
                return;
            }
            onSubmit({ ...values, purchase: purchaseData });
        } else {
            onSubmit(values);
        }
    }

    return (
        <Form {...(form as any)}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control as any}
                    name="name"
                    render={({ field }: any) => (
                        <FormItem>
                            <FormLabel>Nome do Equipamento</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Andaime, Escada, Soprador..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control as any}
                    name="dailyCost"
                    render={({ field }: any) => (
                        <FormItem>
                            <FormLabel>Custo Diária (R$)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control as any}
                    name="supplierId"
                    render={({ field }: any) => (
                        <FormItem>
                            <FormLabel>Fornecedor (Obrigatório)</FormLabel>
                            <div className="flex gap-2 items-center">
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Selecione o proprietário/fornecedor" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name} {s.document ? `(${s.document})` : ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Dialog open={supplierModalOpen} onOpenChange={setSupplierModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" size="icon" className="shrink-0">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
                                        </DialogHeader>
                                        <SupplierForm
                                            onSubmit={(values) => createSupplier.mutate(values)}
                                            isPending={createSupplier.isPending}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {!isEdit && (
                    <PurchaseFields value={purchaseData} onChange={setPurchaseData} title="Dados da Aquisição (Obrigatório)" />
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar Equipamento"}
                </Button>
            </form>
        </Form>
    );
}
