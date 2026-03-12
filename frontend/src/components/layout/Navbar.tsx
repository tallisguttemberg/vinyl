"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, User, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";

const routeTitles: Record<string, string> = {
    "/": "Dashboard",
    "/orders": "Ordens",
    "/orders/new": "Nova Ordem",
    "/materials": "Materiais",
    "/services": "Serviços",
    "/settings": "Configurações",
    "/users": "Usuários",
    "/financial": "Financeiro",
    "/reports/logs": "Logs",
};

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { data: user } = api.user.getMe.useQuery();

    const currentTitle = routeTitles[pathname] || 
                        (pathname.startsWith("/orders/") ? "Detalhes da Ordem" : "Vinyl");

    const handleSignOut = () => {
        localStorage.removeItem("vinyl-token");
        document.cookie = "vinyl-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        router.push("/login");
    };

    return (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-border">
            <div className="flex h-16 items-center px-4 gap-3">
                {/* Hamburger — visível apenas em mobile */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <button
                            className="md:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
                            aria-label="Abrir menu"
                        >
                            <Menu className="h-5 w-5 text-foreground" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 bg-sidebar border-none">
                        <Sidebar
                            isCollapsed={false}
                            onToggle={() => setMobileOpen(false)}
                            onItemClick={() => setMobileOpen(false)}
                            hideToggle
                        />
                    </SheetContent>
                </Sheet>

                <div className="font-bold text-foreground text-xl hidden md:block">
                    Vinyl Dashboard
                </div>

                <div className="font-semibold text-foreground md:hidden truncate flex-1 text-center">
                    {currentTitle}
                </div>

                <div className="ml-auto flex items-center space-x-2 md:space-x-4">
                    <ThemeToggle />
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
                                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold border border-indigo-400/30 shadow-sm">
                                    {(user as any)?.nome?.charAt(0).toUpperCase() || "A"}
                                </div>
                                <span className="text-sm font-medium hidden sm:block">
                                    {(user as any)?.nome || "Admin"}
                                </span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                                <User className="mr-2 h-4 w-4" />
                                Perfil (Em breve)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-500">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
