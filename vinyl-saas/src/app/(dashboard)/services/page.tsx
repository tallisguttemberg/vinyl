"use client";

import { useState } from "react";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    billingType: z.enum(["FIXED", "PER_M2"]),
    defaultPrice: z.coerce.number().optional(),
});

export default function ServicesPage() {
    const [open, setOpen] = useState(false);
    const utils = api.useUtils();

    const { data: services, isLoading } = api.serviceType.getAll.useQuery();
    const createService = api.serviceType.create.useMutation({
        onSuccess: () => {
            utils.serviceType.getAll.invalidate();
            setOpen(false);
            form.reset();
        },
    });
    const deleteService = api.serviceType.delete.useMutation({
        onSuccess: () => {
            utils.serviceType.getAll.invalidate();
        },
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            billingType: "FIXED",
            defaultPrice: 0,
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        createService.mutate(values);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Tipos de Serviço</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Serviço
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Tipo de Serviço</DialogTitle>
                        </DialogHeader>
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
                                <Button type="submit" className="w-full" disabled={createService.isPending}>
                                    {createService.isPending ? "Salvando..." : "Salvar"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo de Cobrança</TableHead>
                            <TableHead>Preço Padrão</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : services?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Nenhum serviço cadastrado.</TableCell>
                            </TableRow>
                        ) : (
                            services?.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell>
                                        {service.billingType === "FIXED" ? "Fixo" : "Por m²"}
                                    </TableCell>
                                    <TableCell>
                                        {service.defaultPrice
                                            ? `R$ ${Number(service.defaultPrice).toFixed(2)}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteService.mutate({ id: service.id })}
                                            disabled={deleteService.isPending}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
