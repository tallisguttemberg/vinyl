"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import SuperJSON from "superjson";

// We import the type from the backend directory. 
// At runtime, Traefik will route /api/trpc to the backend container.
import { type AppRouter } from "../../../backend/src/server/api/root";

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    const [trpcClient] = useState(() =>
        api.createClient({
            links: [
                loggerLink({
                    enabled: (op) =>
                        process.env.NODE_ENV === "development" ||
                        (op.direction === "down" && op.result instanceof Error),
                }),
                unstable_httpBatchStreamLink({
                    transformer: SuperJSON,
                    url: "/api/trpc",
                    headers: () => {
                        const headers = new Headers();
                        headers.set("x-trpc-source", "nextjs-react");

                        // Get token from localStorage
                        if (typeof window !== "undefined") {
                            const token = localStorage.getItem("vinyl-token");
                            if (token) {
                                headers.set("authorization", `Bearer ${token}`);
                            }
                        }

                        return headers;
                    },
                }),
            ],
        })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <api.Provider client={trpcClient} queryClient={queryClient}>
                {props.children}
            </api.Provider>
        </QueryClientProvider>
    );
}
