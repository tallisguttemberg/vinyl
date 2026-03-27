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

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    category: z.enum(["ADHESIVE", "LIQUID"]),
    unit: z.enum(["M2", "ML"]),
    pricePerRoll: z.coerce.number().min(0, "Deve ser maior ou igual a 0"),
    rollLength: z.coerce.number().min(0).optional(),
    width: z.coerce.number().min(0).optional(),
    volume: z.coerce.number().min(0).optional(),
    stockAmount: z.coerce.number().min(0, "Deve ser maior ou igual a 0"),
    supplierId: z.string().min(1, "Fornecedor é obrigatório"),
});

export type MaterialFormValues = z.infer<typeof formSchema>;

interface MaterialFormProps {
    initialValues?: MaterialFormValues;
    onSubmit: (values: MaterialFormValues & { purchase?: PurchaseData }) => void;
    isPending: boolean;
    suppliers: any[];
    isEdit?: boolean;
}

export function MaterialForm({ initialValues, onSubmit, isPending, suppliers, isEdit }: MaterialFormProps) {
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

    const form = useForm<MaterialFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialValues || {
            name: "",
            category: "ADHESIVE",
            unit: "M2",
            pricePerRoll: 0,
            rollLength: 0,
            width: 0,
            volume: 0,
            stockAmount: 0,
            supplierId: "",
        },
    });

    const category = form.watch("category");
    const stockAmount = form.watch("stockAmount");

    function handleSubmit(values: MaterialFormValues) {
        if (!isEdit && values.stockAmount > 0) {
            if (!purchaseData.totalPaid || purchaseData.totalPaid <= 0) {
                toast.error("Informe o valor total pago pela aquisição inicial de estoque.");
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Vinil Preto Fosco" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Material</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue("unit", value === "ADHESIVE" ? "M2" : "ML");
                                    }}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ADHESIVE">Adesivo / Rolo</SelectItem>
                                        <SelectItem value="LIQUID">Líquido / Frasco</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="pricePerRoll"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {category === "ADHESIVE" ? "Preço da Bobina (R$)" : "Preço do Frasco (R$)"}
                                </FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="stockAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Estoque Inicial ({category === "ADHESIVE" ? "m²" : "ml"})
                                </FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {category === "LIQUID" && (
                        <FormField
                            control={form.control}
                            name="volume"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Volume do Frasco (ml)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
                {category === "ADHESIVE" && (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="rollLength"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Metros na Bobina</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="width"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comprimento (m)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fornecedor Principal (Obrigatório)</FormLabel>
                            <div className="flex gap-2 items-center">
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Selecione um fornecedor do material" />
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

                {!isEdit && stockAmount > 0 && (
                    <PurchaseFields value={purchaseData} onChange={setPurchaseData} title="Dados da Compra do Estoque Inicial" />
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                </Button>
            </form>
        </Form>
    );
}
