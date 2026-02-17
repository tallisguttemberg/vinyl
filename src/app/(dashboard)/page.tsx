"use client";

import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Percent, Users } from "lucide-react";

export default function DashboardPage() {
    const { data: stats, isLoading } = api.order.getDashboardStats.useQuery();

    if (isLoading) {
        return <div className="p-8">Carregando estatísticas...</div>;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
                Visão geral da sua empresa.
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {stats?.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.orderCount} ordens ativas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">R$ {stats?.grossProfit.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Margem Média: {stats?.margin.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Custo Material</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">R$ {stats?.totalMaterialCost.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comissões</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">R$ {stats?.totalCommission.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
