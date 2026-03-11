"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
}

export function Navbar({ }: NavbarProps) {
    const router = useRouter();

    const handleSignOut = () => {
        localStorage.removeItem("vinyl-token");
        document.cookie = "vinyl-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        router.push("/login");
    };

    return (
        <div className="border-b bg-background border-border">
            <div className="flex h-16 items-center px-4">
                <div className="font-bold text-foreground text-xl">
                    Vinyl Dashboard
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <button
                        onClick={handleSignOut}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Sign out
                    </button>
                    <ThemeToggle />
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        A
                    </div>
                </div>
            </div>
        </div>
    );
}
