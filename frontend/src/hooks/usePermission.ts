import { api } from "@/trpc/react";

export type ModuleKey =
    | "dashboard"
    | "orders"
    | "materials"
    | "services"
    | "settings"
    | "users";

export type PermissionAction = "visualizar" | "criar" | "editar" | "excluir";

export function usePermission() {
    const { data: user, isLoading } = api.user.getMe.useQuery();

    const hasPermission = (module: ModuleKey, action: PermissionAction): boolean => {
        // Admin has all permissions
        if (user?.perfil === "ADMIN" || user?.userId === "admin") {
            return true;
        }

        const permission = user?.permissoes?.find((p) => p.modulo === module);
        return !!permission?.[action];
    };

    const isAdmin = user?.perfil === "ADMIN" || user?.userId === "admin";

    return {
        hasPermission,
        isAdmin,
        isLoading,
        user,
    };
}
