import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";

export const SYSTEM_MODULES = [
    { key: "dashboard", label: "Dashboard" },
    { key: "orders", label: "Ordens" },
    { key: "materials", label: "Materiais" },
    { key: "services", label: "Tipos de Serviço" },
    { key: "settings", label: "Configurações" },
    { key: "users", label: "Usuários" },
] as const;

export type ModuleKey = typeof SYSTEM_MODULES[number]["key"];

export interface ModulePermission {
    modulo: string;
    visualizar: boolean;
    criar: boolean;
    editar: boolean;
    excluir: boolean;
}

interface PermissionsPanelProps {
    value: ModulePermission[];
    onChange: (permissions: ModulePermission[]) => void;
}

function getPermission(permissions: ModulePermission[], modulo: string): ModulePermission {
    return permissions.find((p) => p.modulo === modulo) ?? {
        modulo,
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false,
    };
}

function updatePermission(
    permissions: ModulePermission[],
    modulo: string,
    field: keyof Omit<ModulePermission, "modulo">,
    checked: boolean
): ModulePermission[] {
    const existing = permissions.find((p) => p.modulo === modulo);
    if (existing) {
        return permissions.map((p) =>
            p.modulo === modulo ? { ...p, [field]: checked } : p
        );
    }
    return [
        ...permissions,
        { modulo, visualizar: false, criar: false, editar: false, excluir: false, [field]: checked },
    ];
}

export function PermissionsPanel({ value, onChange }: PermissionsPanelProps) {
    const { data: user } = api.user.getMe.useQuery();
    const isAdmin = user?.perfil === "ADMIN" || user?.userId === "admin";

    return (
        <div className="space-y-3">
            {!isAdmin && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mb-4">
                    <p className="text-xs text-amber-500 font-medium">
                        Apenas administradores podem gerenciar permissões de acesso.
                    </p>
                </div>
            )}
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 border-b pb-2">
                <span>Módulo</span>
                <span className="text-center">Ver</span>
                <span className="text-center">Criar</span>
                <span className="text-center">Editar</span>
                <span className="text-center">Excluir</span>
            </div>

            {/* Rows */}
            {SYSTEM_MODULES.map(({ key, label }) => {
                const perm = getPermission(value, key);
                return (
                    <div
                        key={key}
                        className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 items-center px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                    >
                        <Label className="text-sm font-medium">{label}</Label>

                        {(["visualizar", "criar", "editar", "excluir"] as const).map((action) => (
                            <div key={action} className="flex justify-center">
                                <Checkbox
                                    id={`${key}-${action}`}
                                    checked={perm[action]}
                                    disabled={!isAdmin}
                                    onCheckedChange={(checked) => {
                                        onChange(updatePermission(value, key, action, !!checked));
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
