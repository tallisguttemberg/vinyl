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
    pricePerRoll: z.coerce.number().min(0, "Deve ser maior ou igual a 0"),
    rollLength: z.coerce.number().min(0.1, "Deve ser maior que 0"),
    width: z.coerce.number().min(0.1, "Deve ser maior que 0"),
});

export default function MaterialsPage() {
    const [open, setOpen] = useState(false);
    const utils = api.useUtils();

    const { data: materials, isLoading } = api.material.getAll.useQuery();
    const createMaterial = api.material.create.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
            setOpen(false);
            form.reset();
        },
    });
    const deleteMaterial = api.material.delete.useMutation({
        onSuccess: () => {
            utils.material.getAll.invalidate();
        },
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            pricePerRoll: 0,
            rollLength: 0,
            width: 0,
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        createMaterial.mutate(values);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Materiais</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Material
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Material</DialogTitle>
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
                                                <Input placeholder="Ex: Vinil Preto Fosco" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                <Button type="submit" className="w-full" disabled={createMaterial.isPending}>
                                    {createMaterial.isPending ? "Salvando..." : "Salvar"}
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
                            <TableHead>Preço Bobina</TableHead>
                            <TableHead>Dimensões</TableHead>
                            <TableHead>Custo Linear/m</TableHead>
                            <TableHead>Custo m²</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : materials?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Nenhum material cadastrado.</TableCell>
                            </TableRow>
                        ) : (
                            materials?.map((material) => (
                                <TableRow key={material.id}>
                                    <TableCell className="font-medium">{material.name}</TableCell>
                                    <TableCell>R$ {Number(material.pricePerRoll).toFixed(2)}</TableCell>
                                    <TableCell>{Number(material.width)}m x {Number(material.rollLength)}m</TableCell>
                                    <TableCell>R$ {Number(material.costPerLinearMeter).toFixed(2)}</TableCell>
                                    <TableCell>R$ {Number(material.costPerSqMeter).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteMaterial.mutate({ id: material.id })}
                                            disabled={deleteMaterial.isPending}
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
