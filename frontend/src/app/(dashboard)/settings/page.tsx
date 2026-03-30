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
import { Separator } from "@/components/ui/separator";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

const formSchema = z.object({
    businessName: z.string().optional(),
    taxId: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    minimumMarginAllowed: z.coerce.number().min(0).max(100).default(20),
    serviceCommissionBase: z.enum(["GROSS_REVENUE", "GROSS_PROFIT"]).default("GROSS_REVENUE"),
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
            minimumMarginAllowed: 20,
            serviceCommissionBase: "GROSS_REVENUE",
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
                minimumMarginAllowed: Number(settings.minimumMarginAllowed) || 20,
                serviceCommissionBase: (settings.serviceCommissionBase as any) || "GROSS_REVENUE",
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
                                <Separator />
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold">Contato</h4>
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
                                </div>
                                {canEdit && (
                                    <Button type="submit" className="w-full mt-4" disabled={updateSettings.isPending}>
                                        {updateSettings.isPending ? "Salvando..." : "Salvar Dados da Organização"}
                                    </Button>
                                )}
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Regras de Negócio e Margens</CardTitle>
                        <CardDescription>
                            Defina parâmetros globais para cálculos financeiros e previsões.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="minimumMarginAllowed"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Margem de Lucro Mínima Sugerida (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} disabled={!canEdit} />
                                            </FormControl>
                                            <FormDescription>
                                                O sistema exibirá alertas de prejuízo se a margem de uma OS for inferior a este valor.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="serviceCommissionBase"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Base para Cálculo de Comissão</FormLabel>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value}
                                                disabled={!canEdit}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione a base..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="GROSS_REVENUE">Faturamento Bruto (Padrão)</SelectItem>
                                                    <SelectItem value="GROSS_PROFIT">Lucro Bruto (Após Custos)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Define se a porcentagem de comissão deve incidir sobre o valor total da venda ou sobre o lucro.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {canEdit && (
                                    <Button type="submit" variant="secondary" className="w-full" disabled={updateSettings.isPending}>
                                        {updateSettings.isPending ? "Salvando..." : "Salvar Regras de Negócio"}
                                    </Button>
                                )}
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
