import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding default admin user...");

    const adminExists = await prisma.user.findUnique({
        where: { usuario: "admin" }
    });

    if (adminExists) {
        console.log("Admin user already exists. Updating password...");
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash("Admin#1234", salt);
        await prisma.user.update({
            where: { id: adminExists.id },
            data: { senhaHash }
        });
        console.log("Admin password updated to: Admin#1234");
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash("Admin#1234", salt);

    const user = await prisma.user.create({
        data: {
            usuario: "admin",
            nomeCompleto: "Administrador do Sistema",
            email: "admin@vinylsaas.com",
            senhaHash: senhaHash,
            perfil: "ADMIN",
            status: "ATIVO",
            organizationId: "default"
        }
    });

    // Create full permissions for admin
    const modules = [
        "dashboard", "orders", "materials", "services", 
        "settings", "users", "financial"
    ];

    await prisma.userPermission.createMany({
        data: modules.map(m => ({
            userId: user.id,
            modulo: m,
            visualizar: true,
            criar: true,
            editar: true,
            excluir: true
        }))
    });

    console.log("Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: Admin#1234");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
