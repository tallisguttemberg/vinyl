"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    User, Mail, Phone, Lock, Save, Loader2, ShieldCheck, 
    Calendar, AtSign, Camera, Trash2 
} from "lucide-react";
import { ChangeEvent, useState } from "react";
import Image from "next/image";

const profileSchema = z.object({
    nomeCompleto: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    telefone: z.string().optional(),
    fotoPerfil: z.string().optional(),
    senha: z.string()
        .min(8, "A senha deve ter pelo menos 8 caracteres")
        .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
        .regex(/[0-9]/, "A senha deve conter pelo menos um número")
        .optional()
        .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const utils = api.useUtils();
    const [isUploading, setIsUploading] = useState(false);
    
    const { data: user, isLoading: isLoadingUser } = api.user.getMe.useQuery();

    const updateProfile = api.user.updateMe.useMutation({
        onSuccess: () => {
            toast.success("Perfil atualizado com sucesso!");
            utils.user.getMe.invalidate();
        },
        onError: (err) => {
            toast.error("Erro ao atualizar perfil", { description: err.message });
        },
    });

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        values: {
            nomeCompleto: user?.nomeCompleto || "",
            email: user?.email || "",
            telefone: user?.telefone || "",
            fotoPerfil: user?.fotoPerfil || "",
            senha: "",
        },
    });

    // Função para converter imagem para Base64
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limite de 1MB para Base64 (evitar sobrecarga no banco)
        if (file.size > 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 1MB.");
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            form.setValue("fotoPerfil", base64String);
            setIsUploading(false);
            toast.info("Foto selecionada. Salve para aplicar.");
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        form.setValue("fotoPerfil", "");
        toast.info("Foto removida. Salve para aplicar.");
    };

    function onSubmit(data: ProfileFormValues) {
        const payload: any = {
            nomeCompleto: data.nomeCompleto,
            email: data.email,
            telefone: data.telefone,
            fotoPerfil: data.fotoPerfil,
        };
        
        if (data.senha && data.senha.length >= 8) {
            payload.senha = data.senha;
        }

        updateProfile.mutate(payload);
    }

    if (isLoadingUser) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentPhoto = form.watch("fotoPerfil");

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header com Avatar/Nome */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                
                <div className="relative group">
                    <div className="h-32 w-32 rounded-3xl overflow-hidden bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-[0_0_25px_rgba(79,70,229,0.3)] transition-all duration-300 group-hover:scale-105 border-4 border-white dark:border-zinc-900">
                        {currentPhoto ? (
                            <Image 
                                src={currentPhoto} 
                                alt={user?.nomeCompleto || "Profile"} 
                                fill 
                                className="object-cover"
                            />
                        ) : (
                            user?.nomeCompleto.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                        )}
                        
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-xs font-semibold gap-2">
                            <Camera className="h-6 w-6" />
                            <span>Trocar Foto</span>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                disabled={isUploading}
                            />
                        </label>
                    </div>

                    {currentPhoto && (
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"
                            onClick={removePhoto}
                            title="Remover foto"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="text-center md:text-left space-y-2 relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{user?.nomeCompleto}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {user?.perfil}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-semibold">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            {user?.status}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(user?.createdAt || "").toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Coluna da Esquerda — Outros Dados */}
                <div className="space-y-6">
                    <Card className="border-border shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                        <CardHeader className="bg-muted/50 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AtSign className="h-4 w-4 text-primary" />
                                Credenciais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuário</p>
                                <p className="font-mono text-sm bg-muted p-2 rounded-md border border-border">@{user?.usuario}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Perfil</p>
                                <p className="text-sm font-medium">{user?.perfil === "ADMIN" ? "Administrador Pleno" : user?.perfil}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                        <CardHeader className="bg-muted/50 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                Segurança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                Suas permissões são geridas pelo administrador. 
                                Caso precise de mais acessos, contate o suporte.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna da Direita — Formulário de Edição */}
                <Card className="md:col-span-2 border-border shadow-lg overflow-hidden flex flex-col">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle>Dados Pessoais</CardTitle>
                        <CardDescription>Atualize suas informações de contato e senha.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="nomeCompleto"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    Nome Completo
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Seu nome" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    Email
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="seu@email.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="telefone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                Telefone (Opcional)
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="(00) 00000-0000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                                        <Lock className="h-4 w-4" />
                                        Alterar Senha
                                    </h4>
                                    <FormField
                                        control={form.control}
                                        name="senha"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input 
                                                        type="password" 
                                                        placeholder="Nova senha (deixe em branco para não alterar)" 
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">
                                                    Mínimo 8 caracteres, uma letra maiúscula e um número.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button 
                                        type="submit" 
                                        className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 shadow-lg px-8"
                                        disabled={updateProfile.isPending || isUploading}
                                    >
                                        {updateProfile.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Salvar Perfil
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
