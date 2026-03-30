"use client";
// Layout dedicado para o modo mobile/vendedor – sem sidebar, fullscreen
export default function MobileLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {children}
        </div>
    );
}
