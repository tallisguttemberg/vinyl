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
import { Building2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";

const formSchema = z.object({
    businessName: z.string().optional(),
    taxId: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
});

export default function SettingsPage() {
    const { hasPermission, isLoading: loadingPerms } = usePermission();
    const { data: settings, isLoading } = api.organizationSettings.getSettings.useQuery(undefined, {
        enabled: !loadingPerms && hasPermission("settings", "visualizar"),
    });

    const utils = api.useUtils();

    const updateSettings = api.organizationSettings.updateSettings.useMutation({
        onSuccess: () => {
            toast.success("Configurações salvas com sucesso!");
            utils.organizationSettings.getSettings.invalidate();
        },
        onError: (error) => {
            console.error("Erro ao salvar:", error);
            toast.error("Erro ao salvar", { description: error.message });
        },
    });

    const canEdit = hasPermission("settings", "editar");

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
        if (!canEdit) return;
        updateSettings.mutate(values);
    }

    if (!loadingPerms && !hasPermission("settings", "visualizar")) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold text-red-500">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para visualizar este módulo.</p>
            </div>
        );
    }

    if (isLoading || loadingPerms) return <div className="text-white p-8">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Configurações da Organização</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


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
                                                <Input placeholder="Minha Empresa de Adesivos" {...field} disabled={!canEdit} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="taxId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CNPJ / CPF</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="00.000.000/0001-00" {...field} disabled={!canEdit} />
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
                                                    <Input placeholder="(00) 00000-0000" {...field} disabled={!canEdit} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {canEdit && (
                                    <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
                                        {updateSettings.isPending ? "Salvando..." : "Salvar Dados de Impressão"}
                                    </Button>
                                )}
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email de Contato</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contato@empresa.com" {...field} disabled={!canEdit} />
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
                                            <Input placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF" {...field} disabled={!canEdit} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {canEdit && (
                                <Button type="submit" disabled={updateSettings.isPending}>
                                    {updateSettings.isPending ? "Salvando..." : "Salvar Contato"}
                                </Button>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>

            </div>
    );
}
