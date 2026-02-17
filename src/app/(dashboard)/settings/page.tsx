"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

// Wait, I saw 'sonner' in some shadcn installations but package.json only has 'lucide-react', 'radix-ui', etc.
// I will implement a basic on success alert.

const formSchema = z.object({
    businessName: z.string().optional(),
    taxId: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
});

export default function SettingsPage() {
    const { data: settings, isLoading } = api.organizationSettings.getSettings.useQuery();

    const utils = api.useUtils();

    const updateSettings = api.organizationSettings.updateSettings.useMutation({
        onSuccess: () => {
            // If we had a toast component I'd use it here.
            alert("Configurações salvas com sucesso!");
            utils.organizationSettings.getSettings.invalidate();
        },
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            businessName: "",
            taxId: "",
            phone: "",
            email: "",
            address: "",
        },
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                businessName: settings.businessName || "",
                taxId: settings.taxId || "",
                phone: settings.phone || "",
                email: settings.email || "",
                address: settings.address || "",
            });
        }
    }, [settings, form]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        updateSettings.mutate(values);
    }

    if (isLoading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Configurações da Organização</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dados da Empresa (Para impressão)</CardTitle>
                    <CardDescription>
                        Estas informações aparecerão no cabeçalho dos documentos gerados (PDFs).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="businessName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Fantasia / Razão Social</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Minha Empresa de Adesivos" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="taxId"
                                    render={({ field }) => (
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
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
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
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email de Contato</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contato@empresa.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Endereço Completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={updateSettings.isPending}>
                                {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
