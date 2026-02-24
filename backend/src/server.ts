import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './server/api/root';
import { createTRPCContext } from './server/api/trpc';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// tRPC bridge
app.use(
    '/api/trpc',
    createExpressMiddleware({
        router: appRouter,
        createContext: async ({ req, res }) => {
            // Adapt headers for createTRPCContext
            const headers = new Headers();
            Object.entries(req.headers).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((v) => headers.append(key, v));
                } else if (value) {
                    headers.set(key, value as string);
                }
            });
            return createTRPCContext({ headers });
        },
    })
);

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
