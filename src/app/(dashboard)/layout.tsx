import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher } from "@clerk/nextjs";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { orgId } = await auth();

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <Sidebar />
            </div>
            <main className="md:pl-72">
                <Navbar />
                <div className="p-8">
                    {!orgId ? (
                        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-6 text-center">
                            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 max-w-lg">
                                <h2 className="text-2xl font-bold mb-2 text-yellow-800 dark:text-yellow-200">Atenção: Selecione uma Organização</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Para utilizar o sistema, você precisa criar ou selecionar uma organização (empresa).
                                </p>
                                <p className="font-medium text-sm mb-4">
                                    Utilize o botão abaixo para criar ou acessar sua organização:
                                </p>
                                <div className="flex justify-center">
                                    <OrganizationSwitcher
                                        hidePersonal
                                        afterCreateOrganizationUrl="/dashboard"
                                        afterSelectOrganizationUrl="/dashboard"
                                        appearance={{
                                            elements: {
                                                rootBox: "w-full max-w-xs",
                                                organizationSwitcherTrigger: "w-full justify-center p-3"
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </main>
        </div>
    );
}
