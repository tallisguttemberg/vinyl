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

const supplySchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    unit: z.string().min(1, "Unidade é obrigatória"),
    unitCost: z.coerce.number().min(0, "Custo deve ser positivo"),
    supplierId: z.string().min(1, "Fornecedor é obrigatório"),
});

export type SupplyFormValues = z.infer<typeof supplySchema>;

interface SupplyFormProps {
    initialValues?: SupplyFormValues;
    onSubmit: (values: SupplyFormValues & { purchase?: PurchaseData }) => void;
    isPending?: boolean;
    suppliers: any[];
    isEdit?: boolean;
}

export function SupplyForm({ initialValues, onSubmit, isPending, suppliers, isEdit }: SupplyFormProps) {
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

    const form = useForm<SupplyFormValues>({
        resolver: zodResolver(supplySchema) as any,
        defaultValues: initialValues ?? {
            name: "",
            unit: "unidade",
            unitCost: 0,
            supplierId: "",
        },
    });

    function handleSubmit(values: SupplyFormValues) {
        if (!isEdit) {
            if (!purchaseData.totalPaid || purchaseData.totalPaid <= 0) {
                toast.error("Informe o valor total pago pela compra.");
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
                            <FormLabel>Nome do Insumo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Verniz, Fita, Rolo..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control as any}
                        name="unit"
                        render={({ field }: any) => (
                            <FormItem>
                                <FormLabel>Unidade</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ml">ml</SelectItem>
                                        <SelectItem value="litro">litro</SelectItem>
                                        <SelectItem value="unidade">unidade</SelectItem>
                                        <SelectItem value="diária">diária</SelectItem>
                                        <SelectItem value="rolo">rolo</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control as any}
                        name="unitCost"
                        render={({ field }: any) => (
                            <FormItem>
                                <FormLabel>Custo Unitário (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
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
                                            <SelectValue placeholder="Selecione um fornecedor para o insumo" />
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
                    <PurchaseFields value={purchaseData} onChange={setPurchaseData} />
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar Insumo"}
                </Button>
            </form>
        </Form>
    );
}
