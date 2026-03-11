
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { api } from "@/trpc/react";
import {
    LayoutDashboard,
    Package,
    Settings2,
    ShoppingCart,
    Building2,
    Users,
    ChevronLeft,
    ChevronRight,
    FileText
} from "lucide-react";

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/",
        color: "text-sky-400",
        module: "dashboard",
    },
    {
        label: "Ordens",
        icon: ShoppingCart,
        href: "/orders",
        color: "text-violet-400",
        module: "orders",
    },
    {
        label: "Materiais",
        icon: Package,
        href: "/materials",
        color: "text-pink-400",
        module: "materials",
    },
    {
        label: "Tipos de Serviço",
        icon: Settings2,
        href: "/services",
        color: "text-orange-400",
        module: "services",
    },
    {
        label: "Configurações",
        icon: Building2,
        href: "/settings",
        color: "text-zinc-400",
        module: "settings",
    },
    {
        label: "Usuários",
        icon: Users,
        href: "/users",
        color: "text-indigo-400",
        module: "users",
    },
    {
        label: "Logs de Status",
        icon: FileText,
        href: "/reports/logs",
        color: "text-emerald-400",
        module: "orders",
    },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { data: settings } = api.organizationSettings.getSettings.useQuery();
    const { data: user } = api.user.getMe.useQuery();

    const logo = settings?.logoUrl;

    // Filtrar rotas com base nas permissões do usuário
    const filteredRoutes = routes.filter((route) => {
        // Admin vê tudo
        if (user?.perfil === "ADMIN" || user?.userId === "admin") return true;

        // Verificar permissão de visualizar para o módulo da rota
        const permission = user?.permissoes?.find((p: any) => p.modulo === route.module);
        return !!permission?.visualizar;
    });

    return (
        <div className={cn(
            "space-y-4 py-4 flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300 relative",
            isCollapsed ? "w-20" : "w-72"
        )}>
            {/* Botão de Toggle - Design Premium */}
            <button
                onClick={onToggle}
                className={cn(
                    "absolute -right-3 top-20 bg-indigo-600 rounded-full h-6 w-6 flex items-center justify-center border border-indigo-400/30 hover:bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(79,70,229,0.4)] z-[100] group",
                    isCollapsed && "rotate-0"
                )}
            >
                {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
                ) : (
                    <ChevronLeft className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
                )}
            </button>

            <div className="px-3 py-2 flex-1 overflow-x-hidden">
                <Link href="/" className={cn(
                    "flex items-center pl-3 mb-8 transition-all duration-300",
                    isCollapsed ? "justify-center pl-0" : ""
                )}>
                    {isCollapsed ? (
                        <div className="text-xl font-bold bg-indigo-600 px-2 rounded">V</div>
                    ) : (
                        <h1 className="text-2xl font-bold">Vinyl</h1>
                    )}
                </Link>

                <div className={cn(
                    "flex items-center gap-x-3 px-3 mb-10 pb-4 border-b border-white/10 transition-all duration-300",
                    isCollapsed ? "justify-center px-0 overflow-hidden" : ""
                )}>
                    {logo ? (
                        <div className="relative h-8 w-8 min-w-[32px]">
                            <Image
                                fill
                                src={logo}
                                alt="Logo"
                                className="rounded-md object-contain"
                            />
                        </div>
                    ) : (
                        <div className="h-8 w-8 min-w-[32px] bg-white/10 rounded-md flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-zinc-400" />
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                {settings?.businessName || "Admin Vinyl"}
                            </p>
                            <p className="text-sm font-bold text-sidebar-foreground truncate max-w-[180px]">
                                {(user as any)?.nome || "Usuário"}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-medium bg-zinc-800/50 w-fit px-1.5 py-0.5 rounded mt-0.5">
                                {(user as any)?.perfil || "OPERADOR"}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    {filteredRoutes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            title={isCollapsed ? route.label : ""}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition",
                                pathname === route.href ? "text-sidebar-foreground bg-sidebar-accent" : "text-sidebar-foreground/70",
                                isCollapsed ? "justify-center" : ""
                            )}
                        >
                            <div className={cn("flex items-center flex-1", isCollapsed ? "justify-center" : "")}>
                                <route.icon className={cn("h-5 w-5", !isCollapsed && "mr-3", route.color)} />
                                {!isCollapsed && <span>{route.label}</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
