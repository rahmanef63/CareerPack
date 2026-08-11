"use client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ConvexHttpClient } from "convex/browser";
import { useState, type ReactNode } from "react";

// Baca langsung supaya Next inline value time build. Akses via getter
// module akan throw ketika nilai kosong — itu yang kita elak di sini,
// supaya bundle layout tak crash sebelum error boundary sempat render.
// Strip trailing slash(es): a Dokploy/env value like "…convex.cloud/"
// otherwise yields "wss://…convex.cloud//api/1.32.0/sync" (double slash),
// which the Convex backend 404s → WebSocket sync + auth never connect.
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(/\/+$/, "");

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
        // `unsavedChangesWarning` defaults to TRUE in the browser (the Convex
        // client only turns it off when `typeof window === "undefined"`). It
        // registers a global beforeunload that fires on ANY dashboard route
        // whenever a mutation or action has not been acked — with its own
        // English string, "Are you sure you want to leave? Your changes may
        // not be saved.", which appears nowhere in this repo and cannot be
        // translated or reasoned about from here.
        //
        // The proxy problem below makes it worse: a request stranded by a
        // closed socket stays "incomplete", so the dialog can fire long after
        // the user finished. CVGenerator already owns a precise guard that
        // only warns when autosave actually failed with unsaved edits, so this
        // one only ever fires spuriously.
        const client = new ConvexReactClient(CONVEX_URL, {
            unsavedChangesWarning: false,
        });
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
