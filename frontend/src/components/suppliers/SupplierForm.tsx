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

const supplierSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    document: z.string().optional(),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
    initialValues?: SupplierFormValues;
    onSubmit: (values: SupplierFormValues) => void;
    isPending?: boolean;
}

export function SupplierForm({ initialValues, onSubmit, isPending }: SupplierFormProps) {
    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema) as any,
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
                            <FormLabel>Nome do Fornecedor / Razão Social</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Adere, Imprimax..." {...field} />
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
                                    <Input placeholder="00.000.000/0001-00" {...field} />
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
                                    <Input placeholder="(00) 00000-0000" {...field} />
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
                                <Input type="email" placeholder="contato@fornecedor.com.br" {...field} />
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
                                <Input placeholder="Rua XPTO, 123 - Bairro - Cidade/UF" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar Fornecedor"}
                </Button>
            </form>
        </Form>
    );
}
