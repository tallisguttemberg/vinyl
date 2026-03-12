"use client";

import { useState } from "react";
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
import { User, Mail, Phone, Lock, FileText, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { PermissionsPanel, ModulePermission } from "./PermissionsPanel";
import { toast } from "sonner";

const userSchema = z.object({
    nomeCompleto: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    usuario: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    senha: z.string()
        .min(8, "Mínimo 8 caracteres")
        .regex(/[A-Z]/, "Ao menos uma letra maiúscula")
        .regex(/[0-9]/, "Ao menos um número"),
    perfil: z.enum(["ADMIN", "GESTOR", "OPERADOR", "CLIENTE"]),
    telefone: z.string().optional(),
    observacoes: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

const DEFAULT_PERMS: Record<string, ModulePermission[]> = {
    ADMIN: [
        { modulo: "dashboard", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "orders", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "materials", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "services", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "settings", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "users", visualizar: true, criar: true, editar: true, excluir: true },
    ],
    GESTOR: [
        { modulo: "dashboard", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "orders", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "materials", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "services", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "settings", visualizar: true, criar: true, editar: true, excluir: true },
        { modulo: "users", visualizar: true, criar: false, editar: false, excluir: false },
    ],
    OPERADOR: [
        { modulo: "dashboard", visualizar: true, criar: false, editar: false, excluir: false },
        { modulo: "orders", visualizar: true, criar: true, editar: false, excluir: false },
        { modulo: "materials", visualizar: true, criar: false, editar: false, excluir: false },
        { modulo: "services", visualizar: true, criar: false, editar: false, excluir: false },
        { modulo: "settings", visualizar: false, criar: false, editar: false, excluir: false },
        { modulo: "users", visualizar: false, criar: false, editar: false, excluir: false },
    ],
    CLIENTE: [
        { modulo: "dashboard", visualizar: false, criar: false, editar: false, excluir: false },
        { modulo: "orders", visualizar: false, criar: false, editar: false, excluir: false },
        { modulo: "materials", visualizar: false, criar: false, editar: false, excluir: false },
        { modulo: "services", visualizar: false, criar: false, editar: false, excluir: false },
        { modulo: "settings", visualizar: false, criar: false, editar: false, excluir: false },
        { modulo: "users", visualizar: false, criar: false, editar: false, excluir: false },
    ]
};

interface CreateUserModalProps {
    onSuccess: () => void;
}

export function CreateUserModal({ onSuccess }: CreateUserModalProps) {
    const utils = api.useUtils();
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [permissions, setPermissions] = useState<ModulePermission[]>(DEFAULT_PERMS.OPERADOR);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            nomeCompleto: "", usuario: "", email: "", senha: "", perfil: "OPERADOR", telefone: "", observacoes: ""
        }
    });

    const createUser = api.user.create.useMutation({
        onSuccess: () => { 
            toast.success("Usuário criado com sucesso!");
            utils.user.getAll.invalidate(); 
            form.reset(); 
            setPermissions(DEFAULT_PERMS.OPERADOR); 
            onSuccess(); 
        },
        onError: (err) => { toast.error("Erro ao criar usuário", { description: err.message }); }
    });

    const onSubmit = (data: UserFormValues) => {
        createUser.mutate({ ...data, permissoes: permissions });
    };

    const checkPasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length >= 8) strength += 33;
        if (/[A-Z]/.test(pass)) strength += 33;
        if (/[0-9]/.test(pass)) strength += 34;
        setPasswordStrength(strength);
    };

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
                                    <Input placeholder="João da Silva" className={`pl-9 ${fieldState.isTouched && !fieldState.invalid ? 'border-green-500' : ''} ${fieldState.invalid ? 'border-red-500' : ''}`} {...field} />
                                    {fieldState.isTouched && !fieldState.invalid && <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-green-500" />}
                                    {fieldState.invalid && <XCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-red-500" />}
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
                                    <Input placeholder="joao_silva" className={`pl-9 ${fieldState.isTouched && !fieldState.invalid ? 'border-green-500' : ''} ${fieldState.invalid ? 'border-red-500' : ''}`} {...field} />
                                    {fieldState.isTouched && !fieldState.invalid && <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-green-500" />}
                                    {fieldState.invalid && <XCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-red-500" />}
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
                                    <Input type="email" placeholder="joao@exemplo.com" className={`pl-9 ${fieldState.isTouched && !fieldState.invalid ? 'border-green-500' : ''} ${fieldState.invalid ? 'border-red-500' : ''}`} {...field} />
                                    {fieldState.isTouched && !fieldState.invalid && <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-green-500" />}
                                    {fieldState.invalid && <XCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-red-500" />}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Senha */}
                    <FormField control={form.control} name="senha" render={({ field, fieldState }) => (
                        <FormItem className="col-span-2">
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input type="password" placeholder="••••••••" className={`pl-9 ${fieldState.isTouched && !fieldState.invalid ? 'border-green-500' : ''} ${fieldState.invalid ? 'border-red-500' : ''}`} {...field}
                                        onChange={(e) => { field.onChange(e); checkPasswordStrength(e.target.value); }} />
                                </div>
                            </FormControl>
                            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                                <div className={`h-full transition-all duration-300 ${passwordStrength <= 33 ? 'bg-red-500' : passwordStrength <= 66 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${passwordStrength}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres, 1 maiúscula, 1 número.</p>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Perfil */}
                    <FormField control={form.control} name="perfil" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Perfil</FormLabel>
                            <Select 
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    setPermissions(DEFAULT_PERMS[value] || []);
                                }} 
                                defaultValue={field.value}
                            >
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
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
                    <Button type="submit" disabled={createUser.isPending}>
                        {createUser.isPending ? "Criando..." : "Criar Usuário"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
