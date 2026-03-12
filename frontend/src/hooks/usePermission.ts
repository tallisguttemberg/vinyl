import { api } from "@/trpc/react";

export type ModuleKey =
    | "dashboard"
    | "orders"
    | "materials"
    | "services"
    | "settings"
    | "users"
    | "financial";

export type PermissionAction = "visualizar" | "criar" | "editar" | "excluir";

export function usePermission() {
    const { data: user, isLoading } = api.user.getMe.useQuery();

    /** Verifica se o usuário atual é um administrador */
    const isAdmin: boolean =
        user?.perfil === "ADMIN" ||
        (user as any)?.userId === "admin" ||
        (user as any)?.id === "admin";

    /**
     * Retorna true se o usuário tem a permissão solicitada.
     * Administradores sempre retornam true sem consultar a tabela de permissões.
     */
    const hasPermission = (module: ModuleKey, action: PermissionAction): boolean => {
        if (!user) return false;
        if (isAdmin) return true;

        const permission = (user as any)?.permissoes?.find((p: any) => p.modulo === module);
        return !!permission?.[action];
    };

    /**
     * Retorna true somente se a ação é permitida E o usuário está carregado.
     * Útil para renderização condicional que precisa esperar o carregamento.
     */
    const canDo = (module: ModuleKey, action: PermissionAction): boolean => {
        if (isLoading) return false;
        return hasPermission(module, action);
    };

    return {
        hasPermission,
        canDo,
        isAdmin,
        isLoading,
        user,
    };
}

