"use client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ConvexHttpClient } from "convex/browser";
import { useState, type ReactNode } from "react";

// Baca langsung supaya Next inline value time build. Akses via getter
// module akan throw ketika nilai kosong — itu yang kita elak di sini,
// supaya bundle layout tak crash sebelum error boundary sempat render.
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

function MissingEnvFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-lg border border-destructive/40 bg-card p-6 shadow-sm">
                <h2 className="font-semibold text-destructive mb-2">
                    Konfigurasi hilang
                </h2>
                <p className="text-sm text-muted-foreground">
                    Variabel <code className="font-mono">NEXT_PUBLIC_CONVEX_URL</code>{" "}
                    tidak diset pada deployment. Tambahkan di environment dan
                    re-deploy.
                </p>
            </div>
        </div>
    );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    const [convex] = useState(() => {
        if (!CONVEX_URL) return null;
        const client = new ConvexReactClient(CONVEX_URL);
        const http = new ConvexHttpClient(CONVEX_URL);
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
    if (!convex) return <MissingEnvFallback />;
    return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
