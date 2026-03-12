"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/trpc/react";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Lock, FileText, ShieldCheck } from "lucide-react";
import { PermissionsPanel, ModulePermission } from "./PermissionsPanel";
import { toast } from "sonner";

const editUserSchema = z.object({
    nomeCompleto: z.string().min(3, "Mínimo 3 caracteres"),
    usuario: z.string().min(3, "Mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    senha: z.string().optional().refine(
        (val) => !val || (val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val)),
        "Senha: mínimo 8 caracteres, 1 maiúscula, 1 número"
    ),
    perfil: z.enum(["ADMIN", "GESTOR", "OPERADOR", "CLIENTE"]),
    status: z.enum(["ATIVO", "INATIVO", "BLOQUEADO"]),
    telefone: z.string().optional(),
    observacoes: z.string().optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
    userId: string;
    onSuccess: () => void;
}

export function EditUserModal({ userId, onSuccess }: EditUserModalProps) {
    const utils = api.useUtils();
    const [permissions, setPermissions] = useState<ModulePermission[]>([]);

    const { data: user, isLoading } = api.user.getById.useQuery({ id: userId });

    const form = useForm<EditUserFormValues>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            nomeCompleto: "", usuario: "", email: "", senha: "", perfil: "OPERADOR",
            status: "ATIVO", telefone: "", observacoes: "",
        },
    });

    // Pré-preencher o formulário quando o usuário carregar
    useEffect(() => {
        if (user) {
            form.reset({
                nomeCompleto: user.nomeCompleto,
                usuario: user.usuario,
                email: user.email,
                senha: "",
                perfil: user.perfil as EditUserFormValues["perfil"],
                status: user.status as EditUserFormValues["status"],
                telefone: user.telefone ?? "",
                observacoes: user.observacoes ?? "",
            });
            setPermissions(user.permissoes as ModulePermission[]);
        }
    }, [user, form]);

    const updateUser = api.user.update.useMutation({
        onSuccess: () => {
            utils.user.getAll.invalidate();
            toast.success("Usuário atualizado!");
            onSuccess();
        },
        onError: (err) => { toast.error("Erro ao atualizar usuário", { description: err.message }); },
    });

    const onSubmit = (data: EditUserFormValues) => {
        updateUser.mutate({
            id: userId,
            ...data,
            senha: data.senha || undefined,
            permissoes: permissions,
        });
    };

    if (isLoading) {
        return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Nome */}
                    <FormField control={form.control} name="nomeCompleto" render={({ field, fieldState }) => (
                        <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input placeholder="João da Silva" className={`pl-9 ${fieldState.invalid ? 'border-red-500' : ''}`} {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Usuário (username) */}
                    <FormField control={form.control} name="usuario" render={({ field, fieldState }) => (
                        <FormItem>
                            <FormLabel>Usuário</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input placeholder="joao_silva" className={`pl-9 ${fieldState.invalid ? 'border-red-500' : ''}`} {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Email */}
                    <FormField control={form.control} name="email" render={({ field, fieldState }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input type="email" placeholder="joao@exemplo.com" className={`pl-9 ${fieldState.invalid ? 'border-red-500' : ''}`} {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Nova Senha (opcional) */}
                    <FormField control={form.control} name="senha" render={({ field, fieldState }) => (
                        <FormItem className="col-span-2">
                            <FormLabel>Nova Senha <span className="text-muted-foreground font-normal">(deixe em branco para manter)</span></FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input type="password" placeholder="••••••••" className={`pl-9 ${fieldState.invalid ? 'border-red-500' : ''}`} {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Perfil */}
                    <FormField control={form.control} name="perfil" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Perfil</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="GESTOR">Gestor</SelectItem>
                                    <SelectItem value="OPERADOR">Operador</SelectItem>
                                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Status */}
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="ATIVO">Ativo</SelectItem>
                                    <SelectItem value="INATIVO">Inativo</SelectItem>
                                    <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Telefone */}
                    <FormField control={form.control} name="telefone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefone (Opcional)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input className="pl-9" placeholder="(11) 90000-0000" {...field} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />

                    {/* Observações */}
                    <FormField control={form.control} name="observacoes" render={({ field }) => (
                        <FormItem className="col-span-2">
                            <FormLabel>Observações (Opcional)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <FileText className="absolute left-2.5 top-3 h-4 w-4 text-gray-500" />
                                    <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Detalhes adicionais..." {...field} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>

                {/* Permissões */}
                <div className="space-y-3">
                    <Separator />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Permissões de Acesso por Módulo</h3>
                    </div>
                    <PermissionsPanel value={permissions} onChange={setPermissions} />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" type="button" onClick={() => onSuccess()}>Cancelar</Button>
                    <Button type="submit" disabled={updateUser.isPending}>
                        {updateUser.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
