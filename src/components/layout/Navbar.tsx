import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export function Navbar() {
    return (
        <div className="border-b">
            <div className="flex h-16 items-center px-4">
                <OrganizationSwitcher
                    afterCreateOrganizationUrl="/dashboard"
                    afterLeaveOrganizationUrl="/dashboard"
                    afterSelectOrganizationUrl="/dashboard"
                    hidePersonal
                />
                <div className="ml-auto flex items-center space-x-4">
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </div>
    );
}
