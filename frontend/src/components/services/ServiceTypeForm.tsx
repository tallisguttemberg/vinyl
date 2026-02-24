"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
    billingType: z.enum(["FIXED", "PER_M2"]),
    defaultPrice: z.coerce.number().optional(),
});

export type ServiceTypeFormValues = z.infer<typeof formSchema>;

interface ServiceTypeFormProps {
    initialValues?: ServiceTypeFormValues;
    onSubmit: (values: ServiceTypeFormValues) => void;
    isPending: boolean;
}

export function ServiceTypeForm({ initialValues, onSubmit, isPending }: ServiceTypeFormProps) {
    const form = useForm<ServiceTypeFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialValues || {
            name: "",
            billingType: "FIXED",
            defaultPrice: 0,
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
                                <Input placeholder="Ex: Adesivado de Parede" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="billingType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Cobrança</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="FIXED">Preço Fixo (por item)</SelectItem>
                                    <SelectItem value="PER_M2">Por m²</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="defaultPrice"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Preço Padrão (Opcional)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                </Button>
            </form>
        </Form>
    );
}
