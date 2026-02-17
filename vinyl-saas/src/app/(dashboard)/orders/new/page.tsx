"use client";

import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Plus, Trash2, Calculator, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const itemSchema = z.object({
    serviceTypeId: z.string().min(1, "Serviço obrigatório"),
    materialId: z.string().optional(), // Can be empty if service doesn't use material
    width: z.coerce.number().min(0),
    height: z.coerce.number().min(0),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
});

const formSchema = z.object({
    customerName: z.string().min(1, "Nome do cliente é obrigatório"),
    commissionRate: z.coerce.number().min(0).max(100),
    wastePercentage: z.coerce.number().min(0).max(100),
    items: z.array(itemSchema).min(1, "Adicione pelo menos um item"),
});

type CalculationResult = {
    totalRevenue: number;
    totalMaterialCost: number;
    totalCommission: number;
    grossProfit: number;
    margin: number;
    items: {
        revenue: number;
        materialCost: number;
        area: number;
    }[];
} | null;

export default function NewOrderPage() {
    const router = useRouter();
    const [calculationResult, setCalculationResult] = useState<CalculationResult>(null);

    const { data: materials } = api.material.getAll.useQuery();
    const { data: serviceTypes } = api.serviceType.getAll.useQuery();

    const createOrder = api.order.create.useMutation({
        onSuccess: () => {
            router.push("/orders");
        },
    });

    const calculateOrder = api.order.calculate.useMutation({
        onSuccess: (data) => {
            setCalculationResult(data);
        },
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            customerName: "",
            commissionRate: 0,
            wastePercentage: 10,
            items: [
                {
                    serviceTypeId: "",
                    materialId: "",
                    width: 0,
                    height: 0,
                    quantity: 1,
                    unitPrice: 0,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    function handleCalculate() {
        const values = form.getValues();
        // Filter out items without service type to avoid errors
        const validItems = values.items.filter(i => i.serviceTypeId);

        if (validItems.length === 0) return;

        calculateOrder.mutate({
            items: validItems.map(i => ({
                ...i,
                materialId: i.materialId || null // Ensure null if empty string
            })),
            commissionRate: values.commissionRate,
            wastePercentage: values.wastePercentage,
        });
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        createOrder.mutate({
            ...values,
            items: values.items.map(i => ({
                ...i,
                materialId: i.materialId || null
            }))
        });
    }

    // Helper to auto-fill price when service type changes (optional logic could be added)
    // For now, user manually inputs price.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Nova Ordem de Serviço</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalhes do Pedido</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="customerName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Cliente</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: João da Silva" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="commissionRate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Comissão (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="wastePercentage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Desperdício (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <Card key={field.id}>
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold">Item {index + 1}</h4>
                                                <Button variant="ghost" size="icon" onClick={() => remove(index)} type="button">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.serviceTypeId`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Tipo de Serviço</FormLabel>
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    field.onChange(value);
                                                                    const service = serviceTypes?.find(st => st.id === value);
                                                                    if (service?.defaultPrice) {
                                                                        form.setValue(`items.${index}.unitPrice`, Number(service.defaultPrice));
                                                                    }
                                                                }}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecione..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {serviceTypes?.map(st => (
                                                                        <SelectItem key={st.id} value={st.id}>{st.name} ({st.billingType === 'FIXED' ? 'Fixo' : 'm²'})</SelectItem>
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
                                                        <FormItem>
                                                            <FormLabel>Material</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecione (Opcional)..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {materials?.map(m => (
                                                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.width`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Largura (m)</FormLabel>
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
                                                            <FormLabel>Altura (m)</FormLabel>
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
                                                            <FormLabel>Qtd</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.unitPrice`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Preço Unit. (R$)</FormLabel>
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
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full dashed border-2"
                                    onClick={() => append({
                                        serviceTypeId: "",
                                        materialId: "",
                                        width: 0,
                                        height: 0,
                                        quantity: 1,
                                        unitPrice: 0
                                    })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                                </Button>
                            </div>

                            <div className="flex gap-4 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
                                <Button type="button" variant="secondary" onClick={handleCalculate} className="flex-1">
                                    <Calculator className="mr-2 h-4 w-4" /> Calcular Prévias
                                </Button>
                                <Button type="submit" className="flex-1" disabled={createOrder.isPending}>
                                    <Save className="mr-2 h-4 w-4" /> {createOrder.isPending ? "Salvando..." : "Finalizar Ordem"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>

                <div>
                    <Card className="sticky top-4">
                        <CardHeader>
                            <CardTitle>Resumo Financeiro</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!calculationResult ? (
                                <p className="text-muted-foreground text-sm">Clique em "Calcular Prévias" para ver o resultado.</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Faturamento Total:</span>
                                        <span className="font-bold">R$ {calculationResult.totalRevenue.toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Custo Material (+{form.getValues('wastePercentage')}% desp):</span>
                                        <span className="text-red-500">R$ {calculationResult.totalMaterialCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Comissão ({form.getValues('commissionRate')}%):</span>
                                        <span className="text-red-500">R$ {calculationResult.totalCommission.toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Lucro Bruto:</span>
                                        <span className="text-green-600">R$ {calculationResult.grossProfit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Margem:</span>
                                        <Badge variant={calculationResult.margin > 30 ? "default" : "destructive"}>
                                            {calculationResult.margin.toFixed(1)}%
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
