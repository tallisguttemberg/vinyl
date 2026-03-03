"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="h-full relative">
            <div className={cn(
                "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 transition-all duration-300",
                isCollapsed ? "md:w-20" : "md:w-72"
            )}>
                <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
            </div>
            <main className={cn(
                "bg-gray-950 min-h-screen transition-all duration-300",
                isCollapsed ? "md:pl-20" : "md:pl-72"
            )}>
                <Navbar />
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
