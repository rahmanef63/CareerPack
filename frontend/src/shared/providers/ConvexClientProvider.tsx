"use client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ConvexHttpClient } from "convex/browser";
import { useState, type ReactNode } from "react";
import { env } from "@/shared/lib/env";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    const [convex] = useState(() => {
        const client = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);
        const http = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
        const origAction = client.action.bind(client);
        // Route auth:* actions via HTTP to avoid "Connection lost while action was in flight"
        // when Dokploy proxy closes idle WebSocket connections mid-flight.
        type ActionFn = (ref: unknown, args?: unknown) => unknown;
        const patched = client as unknown as { action: ActionFn };
        patched.action = (ref, args) => {
            const name = (ref as { _name?: string } | null)?._name ?? String(ref);
            if (typeof name === "string" && name.startsWith("auth:")) {
                return (http.action as ActionFn)(ref, args);
            }
            return (origAction as ActionFn)(ref, args);
        };
        return client;
    });
    return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
