"use client";

import { useForm } from "react-hook-form";
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

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    category: z.enum(["ADHESIVE", "LIQUID"]),
    unit: z.enum(["M2", "ML"]),
    pricePerRoll: z.coerce.number().min(0, "Deve ser maior ou igual a 0"),
    rollLength: z.coerce.number().min(0).optional(),
    width: z.coerce.number().min(0).optional(),
    volume: z.coerce.number().min(0).optional(),
    stockAmount: z.coerce.number().min(0, "Deve ser maior ou igual a 0"),
});

export type MaterialFormValues = z.infer<typeof formSchema>;

interface MaterialFormProps {
    initialValues?: MaterialFormValues;
    onSubmit: (values: MaterialFormValues) => void;
    isPending: boolean;
}

export function MaterialForm({ initialValues, onSubmit, isPending }: MaterialFormProps) {
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
        },
    });

    const category = form.watch("category");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                </Button>
            </form>
        </Form>
    );
}
