"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Calculator, Save, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Constants ───────────────────────────────────────────────────────────────

const FINISHING_OPTIONS = [
    "Ilhós",
    "Bainha",
    "Corte Reto",
    "Corte Especial",
    "Laminação",
    "Verniz de Proteção",
    "Refile",
    "Outro",
] as const;

// ─── Schemas ────────────────────────────────────────────────────────────────

const finishingSchema = z.object({
    name: z.string().min(1, "Nome do acabamento obrigatório"),
    price: z.coerce.number().min(0).default(0),
    cost: z.coerce.number().min(0).default(0),
});

const itemSchema = z.object({
    serviceTypeId: z.string().min(1, "Serviço obrigatório"),
    materialId: z.string().optional().nullable(),
    width: z.coerce.number().min(0).default(0),
    height: z.coerce.number().min(0).default(0),
    mlUsed: z.coerce.number().min(0).default(0),
    quantity: z.coerce.number().min(1),
    priceInputType: z.enum(["UNIT", "TOTAL"]).default("UNIT"),
    unitPrice: z.coerce.number().min(0),
    wastePercentage: z.coerce.number().min(0).default(0),
    finishings: z.array(finishingSchema).default([]),
});

const orderSupplySchema = z.object({
    supplyId: z.string().min(1, "Insumo obrigatório"),
    quantity: z.coerce.number().min(1).default(1),
});

const orderEquipmentSchema = z.object({
    equipmentId: z.string().min(1, "Equipamento obrigatório"),
    days: z.coerce.number().min(1).default(1),
});

const formSchema = z.object({
    customerName: z.string().min(1, "Nome do cliente é obrigatório"),
    type: z.enum(["QUOTATION", "ORDER"]).default("ORDER"),
    aplicadorId: z.string().optional().nullable(),
    serviceCommissionRate: z.coerce.number().min(0).max(100),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
    discountValue: z.coerce.number().min(0).default(0),
    supplies: z.array(orderSupplySchema).default([]),
    equipment: z.array(orderEquipmentSchema).default([]),
    items: z.array(itemSchema).min(1, "Adicione pelo menos um item"),
    validUntil: z.string().optional().nullable(),
});

export type OrderFormValues = z.infer<typeof formSchema>;

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderFormProps {
    initialValues?: OrderFormValues;
    orderId?: string;
    isEditing?: boolean;
}

type CalculationResult = {
    subtotal: number;
    calculatedDiscount: number;
    totalRevenue: number;
    totalCost: number;
    totalMaterialCost: number;
    totalOperationalCost: number;
    totalFinishingCost: number;
    totalSupplyCost: number;
    totalEquipmentCost: number;
    totalServiceCommission: number;
    grossProfit: number;
    margin: number;
    totalArea: number;
    items: {
        revenue: number;
        materialCost: number;
        operationalCost: number;
        finishingCost: number;
        area: number;
    }[];
} | null;

// ─── Component ───────────────────────────────────────────────────────────────

export function OrderForm({ initialValues, orderId, isEditing = false }: OrderFormProps) {
    const router = useRouter();
    const [calculationResult, setCalculationResult] = useState<CalculationResult>(null);

    const { data: materials } = api.material.getAll.useQuery();
    const { data: serviceTypes } = api.serviceType.getAll.useQuery();
    const { data: users } = api.user.getAll.useQuery();
    const { data: allSupplies } = api.supply.getAll.useQuery();
    const { data: allEquipment } = api.equipment.getAll.useQuery();
    const { data: settings } = api.organizationSettings.getSettings.useQuery();

    const createOrder = api.order.create.useMutation({
        onSuccess: (data) => { 
            toast.success(data.type === "QUOTATION" ? "Orçamento criado!" : "Ordem de serviço criada!");
            router.push(data.type === "QUOTATION" ? "/quotations" : "/orders"); 
        },
        onError: (error: any) => { toast.error("Erro ao criar registro", { description: error.message }); },
    });

    const updateOrder = api.order.update.useMutation({
        onSuccess: () => { 
            toast.success("Ordem de serviço atualizada!");
            router.push(`/orders/${orderId}`); 
        },
        onError: (error: any) => { toast.error("Erro ao atualizar ordem", { description: error.message }); },
    });

    const calculateOrder = api.order.calculate.useMutation({
        onSuccess: (data) => { setCalculationResult(data); },
    });

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialValues ?? {
            customerName: "",
            type: (new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("type") as any) || "ORDER",
            aplicadorId: "",
            serviceCommissionRate: 0,
            discountType: "PERCENTAGE",
            discountValue: 0,
            supplies: [],
            equipment: [],
            items: [{
                serviceTypeId: "",
                materialId: "",
                width: 0,
                height: 0,
                mlUsed: 0,
                quantity: 1,
                priceInputType: "UNIT",
                unitPrice: 0,
                wastePercentage: 10,
                finishings: [],
            }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const { fields: supplyFields, append: appendSupply, remove: removeSupply } = useFieldArray({
        control: form.control,
        name: "supplies",
    });

    const { fields: equipmentFields, append: appendEquipment, remove: removeEquipment } = useFieldArray({
        control: form.control,
        name: "equipment",
    });

    // ── Helpers ──────────────────────────────────────────────────────────────

    function convertToUnitPrice(item: OrderFormValues["items"][number]) {
        if (item.priceInputType !== "TOTAL") return item.unitPrice;
        const service = serviceTypes?.find(st => st.id === item.serviceTypeId);
        if (service?.billingType === "PER_M2") {
            const area = item.width * item.height;
            return area > 0 && item.quantity > 0 ? item.unitPrice / (area * item.quantity) : 0;
        }
        return item.quantity > 0 ? item.unitPrice / item.quantity : 0;
    }

    function handleCalculate() {
        const values = form.getValues();
        const validItems = values.items.filter(i => i.serviceTypeId);
        if (validItems.length === 0) return;

        calculateOrder.mutate({
            items: validItems.map((i: any) => ({
                ...i,
                unitPrice: convertToUnitPrice(i),
                materialId: (i.materialId === "none" || !i.materialId) ? null : i.materialId,
                wastePercentage: i.wastePercentage,
            })),
            supplies: values.supplies,
            equipment: values.equipment,
            serviceCommissionRate: values.serviceCommissionRate,
            discountType: values.discountType,
            discountValue: values.discountValue,
        });
    }

    function onSubmit(values: OrderFormValues) {
        const processedItems = values.items.map((i: any) => ({
            ...i,
            unitPrice: convertToUnitPrice(i),
            materialId: (i.materialId === "none" || !i.materialId) ? null : i.materialId,
            wastePercentage: i.wastePercentage,
        }));

        if (isEditing && orderId) {
            updateOrder.mutate({ id: orderId, ...values, items: processedItems });
        } else {
            createOrder.mutate({ ...values, items: processedItems });
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left column: Form ── */}
            <div className="lg:col-span-2">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Order details card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle>Detalhes do Registro</CardTitle>
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <Badge 
                                            variant={field.value === "QUOTATION" ? "outline" : "default"}
                                            className={field.value === "QUOTATION" ? "border-amber-500 text-amber-600 bg-amber-50" : "bg-violet-600"}
                                        >
                                            {field.value === "QUOTATION" ? "ORÇAMENTO" : "ORDEM DE SERVIÇO"}
                                        </Badge>
                                    )}
                                />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Registro</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="QUOTATION">Apenas Orçamento</SelectItem>
                                                        <SelectItem value="ORDER">Ordem de Serviço (Gera Financeiro)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch("type") === "QUOTATION" && (
                                        <FormField
                                            control={form.control}
                                            name="validUntil"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Validade da Proposta</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                                {/* Customer name */}
                                <FormField
                                    control={form.control}
                                    name="customerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1">
                                                Nome do Cliente
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Nome completo do cliente ou razão social da empresa.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: João da Silva" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Salesperson & Commission */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="aplicadorId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-1">
                                                    Aplicador
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Colaborador responsável pela aplicação do serviço.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o aplicador..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">Nenhum</SelectItem>
                                                        {users?.map((user: any) => (
                                                            <SelectItem key={user.id} value={user.id}>
                                                                {user.nomeCompleto} ({user.usuario})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="serviceCommissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-1">
                                                    Comissão de Serviço (%)
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Percentual de comissão que o aplicador receberá sobre este serviço.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Discount */}
                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                    <FormField
                                        control={form.control}
                                        name="discountType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-1">
                                                    Tipo de Desconto
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Define se o desconto será calculado como porcentagem ou valor fixo.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Tipo..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="PERCENTAGE">Porcentagem (%)</SelectItem>
                                                        <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="discountValue"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-1">
                                                    Valor do Desconto
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>O valor numérico do desconto (em % ou R$).</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Insumos & Equipamentos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-1">
                                        Insumos Extras
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Quantidade total do insumo a ser usado neste projeto.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </CardTitle>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => appendSupply({ supplyId: "", quantity: 1 })}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {supplyFields.map((field: any, index: number) => (
                                        <div key={field.id} className="flex gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`supplies.${index}.supplyId`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Insumo..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {allSupplies?.map((s: any) => (
                                                                    <SelectItem key={s.id} value={s.id}>
                                                                        {s.name} (R$ {Number(s.unitCost).toFixed(2)})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`supplies.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem className="w-16">
                                                        <FormControl>
                                                            <Input type="number" min={1} {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSupply(index)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                    {supplyFields.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">Nenhum insumo extra.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-1">
                                        Equipamentos (Diárias)
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Máquinas externos cujo custo é calculado por diária.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </CardTitle>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => appendEquipment({ equipmentId: "", days: 1 })}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {equipmentFields.map((field: any, index: number) => (
                                        <div key={field.id} className="flex gap-2 items-end">
                                            <FormField
                                                control={form.control}
                                                name={`equipment.${index}.equipmentId`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Equip..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {allEquipment?.map((e: any) => (
                                                                    <SelectItem key={e.id} value={e.id}>
                                                                        {e.name} (R$ {Number(e.dailyCost).toFixed(2)})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`equipment.${index}.days`}
                                                render={({ field }) => (
                                                    <FormItem className="w-16">
                                                        <FormControl>
                                                            <Input type="number" min={1} {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeEquipment(index)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                    {equipmentFields.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">Nenhum equipamento.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Items list */}
                        <div className="space-y-4">
                            {fields.map((field: any, index: number) => (
                                <ItemCard
                                    key={field.id}
                                    index={index}
                                    form={form}
                                    materials={materials}
                                    serviceTypes={serviceTypes}
                                    onRemove={() => remove(index)}
                                />
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-dashed border-2 py-8"
                                onClick={() => append({
                                    serviceTypeId: "",
                                    materialId: "",
                                    width: 0,
                                    height: 0,
                                    mlUsed: 0,
                                    quantity: 1,
                                    priceInputType: "UNIT",
                                    unitPrice: 0,
                                    wastePercentage: 10,
                                    finishings: [],
                                })}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Item
                            </Button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
                            <Button type="button" variant="secondary" onClick={handleCalculate} className="flex-1">
                                <Calculator className="mr-2 h-4 w-4" /> Calcular Prévias
                            </Button>
                            <Button type="submit" className="flex-1" disabled={createOrder.isPending || updateOrder.isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                {createOrder.isPending || updateOrder.isPending
                                    ? "Salvando..."
                                    : isEditing ? "Salvar Alterações" : "Finalizar Ordem"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

            {/* ── Right column: Financial summary ── */}
            <div>
                <Card className="sticky top-4">
                    <CardHeader>
                        <CardTitle>Resumo Financeiro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!calculationResult ? (
                            <p className="text-muted-foreground text-sm">
                                Clique em &quot;Calcular Prévias&quot; para prever a DRE deste pedido.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        Faturamento Bruto:
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Soma total dos itens sem descontos.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </span>
                                    <span className="font-bold">R$ {calculationResult.subtotal.toFixed(2)}</span>
                                </div>
                                {calculationResult.calculatedDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-amber-600">
                                        <span>(-) Desconto Concedido:</span>
                                        <span>- R$ {calculationResult.calculatedDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-dashed pt-2">
                                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                        Receita Líquida:
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Valor total após a aplicação dos descontos.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </span>
                                    <span className="font-bold text-primary">R$ {calculationResult.totalRevenue.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">(-) Custo Material (c/ Desp.):</span>
                                    <span className="text-red-500">- R$ {calculationResult.totalMaterialCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">(-) Custo Operacional (Máq):</span>
                                    <span className="text-red-500">- R$ {calculationResult.totalOperationalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">(-) Custos de Extras/Acabamentos:</span>
                                    <span className="text-red-500">- R$ {calculationResult.totalFinishingCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">(-) Custos de Insumos Extras:</span>
                                    <span className="text-red-500">- R$ {calculationResult.totalSupplyCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">(-) Custos de Equipamentos:</span>
                                    <span className="text-red-500">- R$ {calculationResult.totalEquipmentCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium pt-1">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        (=) Custo Total (CMV):
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Soma de todos os custos diretos da operação.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </span>
                                    <span className="text-red-500">- R$ {calculationResult.totalCost.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        (-) Comissão de Serviço ({form.getValues("serviceCommissionRate")}%):
                                    </span>
                                    <span className="text-red-500">- R$ {calculationResult.totalServiceCommission.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span className="flex items-center gap-1">
                                        Lucro Líquido Real:
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>O lucro efetivo que sobra após todos os custos e comissões.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </span>
                                    <span className="text-green-600">R$ {calculationResult.grossProfit.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                                    <span className="text-muted-foreground font-medium">Margem Final Presumida:</span>
                                    <Badge variant={
                                        calculationResult.margin >= (Number(settings?.minimumMarginAllowed) || 20) + 10 ? "default"
                                            : calculationResult.margin >= (Number(settings?.minimumMarginAllowed) || 20) ? "secondary"
                                                : "destructive"
                                    }>
                                        {calculationResult.margin.toFixed(1)}%
                                    </Badge>
                                </div>
                                {calculationResult.margin < (Number(settings?.minimumMarginAllowed) || 20) && (
                                     <div className="bg-red-50 border border-red-200 rounded p-3 mt-2 space-y-1">
                                         <p className="text-[11px] text-red-600 font-bold flex items-start gap-1">
                                            <Info className="h-4 w-4 shrink-0" />
                                            ALERTA: Margem ({calculationResult.margin.toFixed(1)}%) abaixo do mínimo ({Number(settings?.minimumMarginAllowed || 20)}%)
                                         </p>
                                         <p className="text-[10px] text-red-500 leading-tight">
                                            A rentabilidade deste pedido está abaixo das diretrizes da organização. Verifique custos e descontos.
                                         </p>
                                     </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ─── ItemCard sub-component ──────────────────────────────────────────────────

interface ItemCardProps {
    index: number;
    form: ReturnType<typeof useForm<OrderFormValues>>;
    materials: any[] | undefined;
    serviceTypes: any[] | undefined;
    onRemove: () => void;
}

function ItemCard({ index, form, materials, serviceTypes, onRemove }: ItemCardProps) {
    const selectedServiceId = form.watch(`items.${index}.serviceTypeId`);
    const selectedService = serviceTypes?.find(st => st.id === selectedServiceId);
    const isPerM2 = selectedService?.billingType === "PER_M2";

    const matId = form.watch(`items.${index}.materialId`);
    const mat = materials?.find(m => m.id === matId);
    const isLiquid = (mat as any)?.category === "LIQUID";

    const w = Number(form.watch(`items.${index}.width`)) || 0;
    const h = Number(form.watch(`items.${index}.height`)) || 0;
    const q = Number(form.watch(`items.${index}.quantity`)) || 0;
    const ml = Number(form.watch(`items.${index}.mlUsed`)) || 0;
    const p = Number(form.watch(`items.${index}.unitPrice`)) || 0;
    const inputType = form.watch(`items.${index}.priceInputType`);
    
    // Dynamic Finishings Array for this specific Item
    const { fields: finishingFields, append: appendFinishing, remove: removeFinishing } = useFieldArray({
        control: form.control,
        name: `items.${index}.finishings`,
    });

    const finishingsValues = form.watch(`items.${index}.finishings`) || [];

    // Stock alert
    const needed = isLiquid ? ml * q : w * h * q;
    const stock = Number((mat as any)?.stockAmount) || 0;

    // Item subtotal preview
    let subtotal = 0;
    if (inputType === "TOTAL") {
        subtotal = p;
    } else if (isPerM2) {
        subtotal = p * w * h * q;
    } else {
        subtotal = p * q;
    }

    // Add finishing prices to the preview subtotal
    finishingsValues.forEach(f => {
        subtotal += (Number(f.price) || 0);
    });

    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold">Item {index + 1}</h4>
                    <Button variant="ghost" size="icon" onClick={onRemove} type="button">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>

                {/* Service type & Material */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <FormField
                        control={form.control}
                        name={`items.${index}.serviceTypeId`}
                        render={({ field }) => (
                            <FormItem className="md:col-span-5">
                                <FormLabel className="flex items-center gap-1">
                                    Tipo de Serviço
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>O serviço principal que define o cálculo base de preço e custo.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        const service = serviceTypes?.find(st => st.id === value);
                                        if (service?.defaultPrice) {
                                            form.setValue(`items.${index}.unitPrice`, Number(service.defaultPrice));
                                        }
                                        if (service?.wastePercentage) {
                                            form.setValue(`items.${index}.wastePercentage`, Number(service.wastePercentage));
                                        }
                                    }}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {serviceTypes?.map((st: any) => (
                                            <SelectItem key={st.id} value={st.id}>
                                                {st.name} ({st.billingType === "FIXED" ? "Fixo" : "m²"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name={`items.${index}.materialId`}
                        render={({ field }) => (
                            <FormItem className="md:col-span-4">
                                <FormLabel className="flex items-center gap-1">
                                    Material
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>O material base (vinil, lona, etc) que será consumido.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </FormLabel>
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        form.setValue(`items.${index}.mlUsed`, 0);
                                    }}
                                    value={field.value || "none"}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sem Material" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Sem Material</SelectItem>
                                        {materials?.map((m: any) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name} ({(m as any).category === "LIQUID" ? "Líquido" : "m²"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                {mat && (
                                    needed > stock ? (
                                        <p className="text-[10px] text-amber-600 font-medium mt-1">
                                            ⚠️ Falta Estoque ({stock.toFixed(1)} {(mat as any).unit} disp.)
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Estoque: {stock.toFixed(1)} {(mat as any).unit}
                                        </p>
                                    )
                                )}
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name={`items.${index}.wastePercentage`}
                        render={({ field }) => (
                            <FormItem className="md:col-span-3">
                                <FormLabel className="flex items-center gap-1">
                                    Desperdício (%)
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Margem extra para cobrir sobras e recortes.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Dimensions + Quantity + Optional ML + Price */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <FormField
                        control={form.control}
                        name={`items.${index}.width`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-1">
                                    Compr. (m)
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Largura/Comprimento da peça em metros.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`items.${index}.height`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-1">
                                    Alt. (m)
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Altura da peça em metros.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-1">
                                    Qtd
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Número de unidades idênticas.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* ML field (only if liquid material) */}
                    {isLiquid ? (
                        <FormField
                            control={form.control}
                            name={`items.${index}.mlUsed`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1">
                                        ML Adic.
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Volume extra de líquido consumido por unidade.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <div className="hidden md:block" />
                    )}

                    <div className="col-span-2 flex flex-col space-y-1">
                        <Label className="text-xs font-semibold flex items-center gap-1 mb-1">
                            Preço
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Defina o valor unitário ou o total deste item.</p>
                                </TooltipContent>
                            </Tooltip>
                        </Label>
                        <FormField
                            control={form.control}
                            name={`items.${index}.priceInputType`}
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-6 text-[10px] py-0 px-2 bg-muted/50 border-none">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="UNIT">{isPerM2 ? "Cobrar m²" : "Cobrar Unit."}</SelectItem>
                                            <SelectItem value="TOTAL">Valor Total</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" step="0.01" className="h-9 font-medium" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Finishings Array */}
                <div className="pt-4 border-t mt-4">
                    <div className="flex items-center justify-between mb-2">
                         <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                             Acabamentos / Extras
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Serviços adicionais como ilhós, bainha ou refile.</p>
                                </TooltipContent>
                            </Tooltip>
                         </h5>
                         <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => appendFinishing({ name: "", price: 0, cost: 0 })}
                         >
                            <Plus className="h-3 w-3 mr-1" /> Add Acabamento
                         </Button>
                    </div>

                    {finishingFields.length > 0 ? (
                        <div className="space-y-2">
                             {finishingFields.map((fld: any, fIdx: number) => (
                                 <div key={fld.id} className="flex gap-2 items-start bg-muted/20 p-2 rounded-md">
                                      <FormField
                                        control={form.control}
                                        name={`items.${index}.finishings.${fIdx}.name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel className="text-[10px] uppercase text-muted-foreground sr-only">Nome</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Acabamento..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {FINISHING_OPTIONS.map((opt: string) => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name={`items.${index}.finishings.${fIdx}.price`}
                                        render={({ field }) => (
                                            <FormItem className="w-24">
                                                <FormLabel className="text-[10px] uppercase text-muted-foreground sr-only">Cobrado</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="Preço" className="h-8 text-sm text-primary" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name={`items.${index}.finishings.${fIdx}.cost`}
                                        render={({ field }) => (
                                            <FormItem className="w-24">
                                                <FormLabel className="text-[10px] uppercase text-muted-foreground sr-only">Custo</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="Custo" className="h-8 text-sm text-red-500" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                      />
                                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFinishing(fIdx)}>
                                          <Trash2 className="h-3 w-3" />
                                      </Button>
                                 </div>
                             ))}
                        </div>
                    ) : (
                        <p className="text-[11px] text-muted-foreground/60 italic">Nenhum acabamento extra adicionado.</p>
                    )}
                </div>

                {/* Item subtotal preview */}
                <div className="mt-2 p-2 bg-muted/30 border-l-4 border-primary rounded-r-md flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Subtotal deste Item:</span>
                    <span className="font-bold text-base text-primary">R$ {subtotal.toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>
    );
}
