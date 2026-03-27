"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";


export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const { data: settings } = api.organizationSettings.getPublicSettings.useQuery();

    const logoLight = settings?.logoUrl || "/logo.png";
    const logoDark = settings?.logoDarkUrl || "/logo-dark.png";

    const loginMutation = api.user.login.useMutation({
        onSuccess: (data) => {
            // Set session token (using the returned user ID as token)
            localStorage.setItem("vinyl-token", data.token);
            // Set a cookie for the middleware to read
            document.cookie = `vinyl-session=${data.token}; path=/`;
            router.push("/");
        },
        onError: (err) => {
            setError(err.message || "Invalid username or password");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        loginMutation.mutate({ usuario: username, senha: password });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-card p-10 rounded-2xl shadow-xl border border-border">
                <div className="flex flex-col items-center">
                    {/* Logo container enlarged to h-40 for high prominence */}
                    <div className="relative h-40 w-full mb-4 transition-transform duration-300 hover:scale-105">
                        <Image
                            src={logoLight}
                            alt="Vinyl Logo"
                            fill
                            className="object-contain dark:hidden drop-shadow-md"
                            priority
                        />
                        <Image
                            src={logoDark}
                            alt="Vinyl Logo Dark"
                            fill
                            className="object-contain hidden dark:block drop-shadow-md"
                            priority
                        />
                    </div>
                    <p className="mt-2 text-center text-sm text-muted-foreground font-medium">
                        Insira suas credenciais para acessar o painel
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="relative block w-full appearance-none rounded-none rounded-t-md border border-input bg-background px-3 py-3 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                                placeholder="Usuário"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full appearance-none rounded-none rounded-b-md border border-input bg-background px-3 py-3 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm pr-10 transition-colors"
                                placeholder="Senha"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none focus:z-20 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                    <Eye className="h-5 w-5" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-destructive text-sm font-semibold text-center bg-destructive/10 py-2 rounded-md">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-lg border border-transparent bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            Entrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
