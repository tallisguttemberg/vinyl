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

const customerSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    document: z.string().optional().nullable(),
    email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    initialValues?: CustomerFormValues;
    onSubmit: (values: CustomerFormValues) => void;
    isPending?: boolean;
}

export function CustomerForm({ initialValues, onSubmit, isPending }: CustomerFormProps) {
    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as any,
        defaultValues: initialValues ?? {
            name: "",
            document: "",
            email: "",
            phone: "",
            address: "",
        },
    });

    return (
        <Form {...(form as any)}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control as any}
                    name="name"
                    render={({ field }: any) => (
                        <FormItem>
                            <FormLabel>Nome do Cliente / Razão Social</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: João Silva, Empresa Ltda..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control as any}
                        name="document"
                        render={({ field }: any) => (
                            <FormItem>
                                <FormLabel>CNPJ / CPF</FormLabel>
                                <FormControl>
                                    <Input placeholder="000.000.000-00" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control as any}
                        name="phone"
                        render={({ field }: any) => (
                            <FormItem>
                                <FormLabel>Telefone / WhatsApp</FormLabel>
                                <FormControl>
                                    <Input placeholder="(00) 00000-0000" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control as any}
                    name="email"
                    render={({ field }: any) => (
                        <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="cliente@exemplo.com.br" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control as any}
                    name="address"
                    render={({ field }: any) => (
                        <FormItem>
                            <FormLabel>Endereço Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Rua XPTO, 123 - Bairro - Cidade/UF" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar Cliente"}
                </Button>
            </form>
        </Form>
    );
}
