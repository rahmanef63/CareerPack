"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { notify } from "@/shared/lib/notify";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoPBOverlay } from "@/shared/hooks/useDemoOverlay";
import {
  DEFAULT_AUTO_TOGGLES,
} from "../../../../../convex/profile/autoBlocks";
import {
  TEMPLATE_THEMES,
  type Block,
  type HeaderBg,
  type PersonalBrandingTheme,
} from "../blocks/types";

function isKnownTheme(t: unknown): t is PersonalBrandingTheme {
  return typeof t === "string" && (TEMPLATE_THEMES as readonly string[]).includes(t);
}
import type { AutoToggles } from "../../../../../convex/profile/autoBlocks";
import { DEFAULT_FORM_STATE } from "./defaults";
import { validateSlug } from "./slugValidation";
import type {
  Bind,
  CtaType,
  FieldKey,
  FormState,
  Mode,
  SetField,
  SlugValidation,
  SubmitOptions,
} from "./types";

/**
 * Server-shape minimal slice we read from getMyPublicProfile.
 * Re-typed here as `unknown`-safe so we can hydrate without depending
 * on the convex-generated type — keeps the form layer free of generated
 * imports that change paths often.
 */
interface ServerData {
  enabled: boolean;
  slug: string;
  headline: string;
  bioShow: boolean;
  skillsShow: boolean;
  targetRoleShow: boolean;
  contactEmail: string;
  linkedinUrl: string;
  portfolioUrl: string;
  allowIndex: boolean;
  avatarShow: boolean;
  portfolioShow: boolean;
  mode?: string | null;
  autoToggles?: Partial<AutoToggles> | null;
  theme?: string | null;
  headerBg?: HeaderBg | null;
  blocks?: Block[];
  htmlExport?: boolean;
  embedExport?: boolean;
  promptExport?: boolean;
  availableForHire?: boolean;
  availabilityNote?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  ctaType?: string | null;
  sectionOrder?: string[] | null;
}

function seedFromServer(data: ServerData): FormState {
  return {
    enabled: Boolean(data.enabled),
    slug: data.slug ?? "",
    headline: data.headline ?? "",

    avatarShow: Boolean(data.avatarShow),
    bioShow: Boolean(data.bioShow),
    skillsShow: Boolean(data.skillsShow),
    targetRoleShow: Boolean(data.targetRoleShow),
    portfolioShow: Boolean(data.portfolioShow),

    contactEmail: data.contactEmail ?? "",
    linkedinUrl: data.linkedinUrl ?? "",
    portfolioUrl: data.portfolioUrl ?? "",

    allowIndex: Boolean(data.allowIndex),

    mode: ((data.mode as Mode) ?? "auto") as Mode,
    theme: (isKnownTheme(data.theme) ? (data.theme as PersonalBrandingTheme) : "template-v2"),
    headerBg: data.headerBg ?? null,
    autoToggles: {
      showExperience:
        data.autoToggles?.showExperience ?? DEFAULT_AUTO_TOGGLES.showExperience,
      showEducation:
        data.autoToggles?.showEducation ?? DEFAULT_AUTO_TOGGLES.showEducation,
      showCertifications:
        data.autoToggles?.showCertifications ??
        DEFAULT_AUTO_TOGGLES.showCertifications,
      showProjects:
        data.autoToggles?.showProjects ?? DEFAULT_AUTO_TOGGLES.showProjects,
      showSocial:
        data.autoToggles?.showSocial ?? DEFAULT_AUTO_TOGGLES.showSocial,
      showLanguages:
        data.autoToggles?.showLanguages ?? DEFAULT_AUTO_TOGGLES.showLanguages,
    },
    blocks: data.blocks ?? [],
    htmlExport: Boolean(data.htmlExport),
    embedExport: Boolean(data.embedExport),
    promptExport: Boolean(data.promptExport),
    availableForHire: Boolean(data.availableForHire),
    availabilityNote: data.availabilityNote ?? "",
    ctaLabel: data.ctaLabel ?? "",
    ctaUrl: data.ctaUrl ?? "",
    ctaType: (isCtaType(data.ctaType) ? data.ctaType : "link") as CtaType,
    sectionOrder: Array.isArray(data.sectionOrder) ? data.sectionOrder : [],
  };
}

function isCtaType(t: unknown): t is CtaType {
  return (
    typeof t === "string" &&
    (t === "link" || t === "email" || t === "calendly" || t === "download")
  );
}

export interface PBForm {
  /** Current form state (read everywhere). */
  state: FormState;
  /** Imperative setter for one field. */
  set: SetField;
  /** Reactive {value, onChange} pair for one field — drop into shadcn inputs. */
  bind: Bind;
  /** True while the publish/save mutation is in-flight. */
  saving: boolean;
  /** Persist current state. `activate` forces enabled=true. */
  submit: (opts?: SubmitOptions) => Promise<void>;
  /** Memoised slug validation for the current state.slug. */
  slugValidation: SlugValidation;
  /** True iff slug is valid AND ≥ min length — controls publish button. */
  canEnable: boolean;
  /** Lowercased trimmed slug — used for URL display. */
  slugTrimmed: string;
  /** Server snapshot — drives the StatusBanner so it shows ground
   *  truth rather than dirty form state. null while loading. */
  serverState: ServerData | null;
  /** Epoch-ms timestamp of the most recent successful save (manual or
   *  auto). null before the first save in this session. Drives the
   *  "Tersimpan otomatis · Xs lalu" indicator. */
  lastSavedAt: number | null;
  /** True while the auto-save debounce window is pending — i.e. the
   *  user has unsaved typing in the last <1.5s. Used by the indicator
   *  to show "Menyimpan…" between manual saves. */
  autoSavePending: boolean;
}

/**
 * Personal Branding form hook — central state container.
 *
 * Sections accept `bind`/`set` as props rather than touching state
 * directly, which keeps each section ignorant of fields it doesn't
 * own. Adding a field is a 4-touchpoint change (FormState, defaults,
 * hydrate, the one section that uses it) — every other section keeps
 * working unmodified.
 */
export function usePBForm(): PBForm {
  const { state: authState } = useAuth();
  const isAuthenticated = authState.isAuthenticated;
  const isDemo = authState.isDemo;

  const data = useQuery(
    api.profile.queries.getMyPublicProfile,
    isAuthenticated && !isDemo ? {} : "skip",
  );
  const update = useMutation(api.profile.mutations.updateMyPublicProfile);

  const demoPB = useDemoPBOverlay();

  const [state, setState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [autoSavePending, setAutoSavePending] = useState(false);
  const seededRef = useRef(false);
  // Snapshot of the last-submitted FormState (excluding `enabled`).
  // Drives the autosave loop — pinned at hydration time so the
  // initial seed does NOT count as a "change" that fires autosave.
  // Hoisted here so the seed effect can pin it pre-emptively.
  const lastSubmittedRef = useRef<string>("");
  // Reset the seed guard on auth-mode flip — otherwise loading the page
  // unauth (or in demo) seeds the empty/demo branch, then signing in
  // would never re-seed from the real `data` payload because the ref
  // sticks at `true`.
  const lastAuthModeRef = useRef<"demo" | "auth" | "none">("none");

  // Hydrate once when server data arrives. Subsequent server-side
  // changes (e.g. cron, admin edit) intentionally don't overwrite
  // local edits — would feel like a phantom reset. User can refresh.
  useEffect(() => {
    const mode: "demo" | "auth" | "none" = isDemo
      ? "demo"
      : isAuthenticated
        ? "auth"
        : "none";
    if (mode !== lastAuthModeRef.current) {
      seededRef.current = false;
      lastAuthModeRef.current = mode;
      // Reset the autosave snapshot too — otherwise re-seeding for a
      // different user would compare against the previous user's
      // baseline and fire a spurious save.
      lastSubmittedRef.current = "";
    }
    if (seededRef.current) return;
    if (isDemo) {
      seededRef.current = true;
      const seeded = seedFromServer({
        ...demoPB.state,
        blocks: [],
      } as ServerData);
      // Pin the autosave baseline to the seeded snapshot so the very
      // first useEffect run after hydration sees "no change" and does
      // NOT fire an autosave (otherwise we'd hit the backend with a
      // value that was just read from it — and worse, that value may
      // contain new client defaults the legacy server hasn't shipped
      // yet, triggering ArgumentValidationError races during deploys).
      lastSubmittedRef.current = JSON.stringify({ ...seeded, enabled: undefined });
      setState(seeded);
      return;
    }
    if (!data) return;
    seededRef.current = true;
    const seeded = seedFromServer(data as ServerData);
    lastSubmittedRef.current = JSON.stringify({ ...seeded, enabled: undefined });
    setState(seeded);
  }, [data, isDemo, isAuthenticated, demoPB.state]);

  const set: SetField = useCallback((key, value) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const bind: Bind = useCallback(
    <K extends FieldKey>(key: K) => ({
      value: state[key],
      onChange: (v: FormState[K]) =>
        setState((s) => ({ ...s, [key]: v })),
    }),
    [state],
  );

  const slugValidation = useMemo(
    () => validateSlug(state.slug),
    [state.slug],
  );
  const slugTrimmed = state.slug.trim().toLowerCase();
  const canEnable = slugValidation.ok && slugTrimmed.length >= 3;

  const submit = useCallback(
    async (opts: SubmitOptions = {}): Promise<void> => {
      if (saving) return;
      if (!slugValidation.ok) {
        notify.warning(slugValidation.message ?? "Slug tidak valid");
        return;
      }
      const finalEnabled = opts.activate ? true : state.enabled;
      setSaving(true);
      try {
        if (isDemo) {
          await demoPB.save({
            enabled: finalEnabled,
            slug: slugTrimmed,
            headline: state.headline,
            bioShow: state.bioShow,
            skillsShow: state.skillsShow,
            targetRoleShow: state.targetRoleShow,
            contactEmail: state.contactEmail,
            linkedinUrl: state.linkedinUrl,
            portfolioUrl: state.portfolioUrl,
            allowIndex: state.allowIndex,
            avatarShow: state.avatarShow,
            portfolioShow: state.portfolioShow,
            mode: state.mode,
            autoToggles: state.autoToggles,
            theme: state.theme,
            headerBg: state.headerBg ?? null,
            htmlExport: state.htmlExport,
            embedExport: state.embedExport,
            promptExport: state.promptExport,
          });
        } else {
          await update({
            enabled: finalEnabled,
            slug: slugTrimmed,
            headline: state.headline,
            bioShow: state.bioShow,
            skillsShow: state.skillsShow,
            targetRoleShow: state.targetRoleShow,
            contactEmail: state.contactEmail,
            linkedinUrl: state.linkedinUrl,
            portfolioUrl: state.portfolioUrl,
            allowIndex: state.allowIndex,
            avatarShow: state.avatarShow,
            portfolioShow: state.portfolioShow,
            mode: state.mode,
            autoToggles: state.autoToggles,
            theme: state.theme,
            headerBg: state.headerBg ?? undefined,
            blocks: state.blocks,
            htmlExport: state.htmlExport,
            embedExport: state.embedExport,
            promptExport: state.promptExport,
            availableForHire: state.availableForHire,
            availabilityNote: state.availabilityNote,
            ctaLabel: state.ctaLabel,
            ctaUrl: state.ctaUrl,
            ctaType: state.ctaType,
            sectionOrder: state.sectionOrder,
          });
        }
        if (opts.activate) {
          setState((s) => ({ ...s, enabled: true }));
        }
        setLastSavedAt(Date.now());
        if (!opts.silent) {
          notify.success(
            finalEnabled
              ? `Tersimpan — careerpack.org/${slugTrimmed} update dalam beberapa detik (cache ISR ~60s).`
              : "Tersimpan sebagai draft (belum publik)",
          );
        }
      } catch (err) {
        // Always toast errors — even silent auto-saves shouldn't fail
        // quietly and leave the user thinking everything saved fine.
        notify.fromError(err, "Gagal menyimpan");
      } finally {
        setSaving(false);
      }
    },
    [state, saving, slugValidation, slugTrimmed, update, isDemo, demoPB],
  );

  // ----------------------------------------------------------------
  // Auto-save loop
  // ----------------------------------------------------------------
  // Debounces 1500ms after the last edit, then silently calls submit.
  // Skipped in demo mode (no backend) and when the slug isn't valid
  // yet (would just throw and toast). The first effect run after
  // hydration is also a no-op — `seededRef` is freshly true and the
  // state hasn't drifted from the server yet. We snapshot the
  // last-submitted state in `lastSubmittedRef` so re-renders that
  // don't actually mutate any field don't fire a save.
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    if (isDemo) return;
    if (!seededRef.current) return;
    if (!canEnable) return;
    // Snapshot the form state we'd save — JSON for cheap deep-equal.
    // Excludes `enabled` so toggling enabled via Save & Publish doesn't
    // get mistaken for a re-save trigger.
    const snapshot = JSON.stringify({ ...state, enabled: undefined });
    if (snapshot === lastSubmittedRef.current) return;
    setAutoSavePending(true);
    const t = window.setTimeout(() => {
      lastSubmittedRef.current = snapshot;
      submitRef.current({ silent: true }).finally(() => {
        setAutoSavePending(false);
      });
    }, 1500);
    return () => {
      window.clearTimeout(t);
      setAutoSavePending(false);
    };
  }, [state, isDemo, canEnable]);

  return {
    state,
    set,
    bind,
    saving,
    submit,
    slugValidation,
    canEnable,
    slugTrimmed,
    serverState: isDemo
      ? ({ ...demoPB.state, blocks: [] } as ServerData)
      : ((data as ServerData | null) ?? null),
    lastSavedAt,
    autoSavePending,
  };
}
