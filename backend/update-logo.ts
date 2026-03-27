import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    try {
        const imagePath = path.resolve('../frontend/public/logo.png');
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;

        const imageDarkPath = path.resolve('../frontend/public/logo-dark.png');
        const imageDarkBuffer = fs.readFileSync(imageDarkPath);
        const base64DarkImage = imageDarkBuffer.toString('base64');
        const dataDarkUrl = `data:image/png;base64,${base64DarkImage}`;

        await prisma.organizationSettings.updateMany({
            where: { organizationId: 'default' },
            data: { 
                logoUrl: dataUrl,
                logoDarkUrl: dataDarkUrl
            }
        });
        console.log("Logo updated successfully in database.");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
