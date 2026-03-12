import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-8 animate-in fade-in duration-500">
            <div>
                <Skeleton className="h-10 w-[200px] mb-2" />
                <Skeleton className="h-5 w-[400px]" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[120px] mb-2" />
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-3 w-[60px]" />
                                <Skeleton className="h-3 w-[80px]" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col bg-muted/50 rounded-lg p-4 min-h-[500px] space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-6 w-[100px]" />
                            <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        {[...Array(3)].map((_, j) => (
                            <Card key={j} className="p-4 space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-[80%]" />
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-[60px]" />
                                    <Skeleton className="h-5 w-[80px] rounded-full" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
