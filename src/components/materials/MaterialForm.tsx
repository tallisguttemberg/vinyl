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

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    pricePerRoll: z.coerce.number().min(0, "Deve ser maior ou igual a 0"),
    rollLength: z.coerce.number().min(0.1, "Deve ser maior que 0"),
    width: z.coerce.number().min(0.1, "Deve ser maior que 0"),
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
            pricePerRoll: 0,
            rollLength: 0,
            width: 0,
            stockAmount: 0,
        },
    });

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
                        name="pricePerRoll"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço da Bobina (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="stockAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estoque Inicial / Atual (m²)</FormLabel>
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
                                <FormLabel>Largura (m)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                </Button>
            </form>
        </Form>
    );
}
