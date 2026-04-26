"use client";

import { useCallback, useMemo } from "react";
import { notify } from "@/shared/lib/notify";
import { useAuth } from "./useAuth";
import { useLocalStorageState } from "./useLocalStorageState";
import {
  DEMO_AGENDA,
  DEMO_APPLICATIONS,
  DEMO_CHECKLIST_PROGRESS,
  DEMO_CONTACTS,
  DEMO_CV,
  DEMO_NOTIFICATIONS,
  DEMO_PB,
  DEMO_PORTFOLIO,
  DEMO_PROFILE,
  type DemoAgendaSeed,
  type DemoAgendaType,
  type DemoApplicationSeed,
  type DemoContactSeed,
  type DemoNotificationSeed,
  type DemoNotificationType,
  type DemoPBSeed,
  type DemoPortfolioSeed,
} from "@/shared/data/demoUser";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import type { Application, ApplicationStatus } from "@/shared/types";
import type {
  PortfolioFormValues,
  PortfolioItem,
  PortfolioItemId,
} from "@/slices/portfolio/types";
import type {
  Contact,
  ContactFormValues,
  ContactId,
} from "@/slices/networking/types";
import type { CVData } from "@/slices/cv-generator/types";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/** Branch-on-isDemo helper — returns true while the current session
 *  is the anonymous demo user. Components / hooks branch on this to
 *  swap Convex state for localStorage state. */
export function useIsDemo(): boolean {
  const { state } = useAuth();
  return state.isDemo;
}

// ---------------------------------------------------------------------
// Applications overlay
// ---------------------------------------------------------------------

const APPLICATIONS_KEY = "careerpack:demo:applications";

interface ApplicationsHook {
  applications: Application[];
  isLoading: boolean;
  create: (input: {
    company: string;
    position: string;
    location?: string;
    salary?: string;
    source?: string;
    notes?: string;
  }) => Promise<void>;
  updateStatus: (
    id: string,
    status: ApplicationStatus,
    notes?: string,
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

function applicationFromSeed(s: DemoApplicationSeed, now: number): Application {
  const ts = now - s.daysAgo * DAY;
  const iso = new Date(ts).toISOString().split("T")[0];
  return {
    id: s.id,
    company: s.company,
    position: s.position,
    status: s.status,
    appliedDate: iso,
    lastUpdate: iso,
    notes: s.notes,
    salary: s.salary,
  };
}

export function useDemoApplicationsOverlay(): ApplicationsHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoApplicationSeed[]>(
    APPLICATIONS_KEY,
    [...DEMO_APPLICATIONS],
  );
  const now = Date.now();
  const applications = useMemo(
    () => seeds.map((s) => applicationFromSeed(s, now)),
    [seeds, now],
  );

  const create: ApplicationsHook["create"] = useCallback(
    async (input) => {
      setSeeds((prev) => [
        ...prev,
        {
          id: `app-${Date.now().toString(36)}`,
          company: input.company,
          position: input.position,
          status: "applied",
          daysAgo: 0,
          notes: input.notes,
          salary: input.salary,
        },
      ]);
      notify.success("Tersimpan di mode demo (lokal)");
    },
    [setSeeds],
  );

  const updateStatus: ApplicationsHook["updateStatus"] = useCallback(
    async (id, status, notes) => {
      setSeeds((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status, notes: notes ?? s.notes } : s,
        ),
      );
    },
    [setSeeds],
  );

  const remove: ApplicationsHook["remove"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  return { applications, isLoading: false, create, updateStatus, remove };
}

// ---------------------------------------------------------------------
// Portfolio overlay — output shape matches `PortfolioItem` (Doc-shaped)
// so the consumer hook can return demo + real items behind one type.
// ---------------------------------------------------------------------

const PORTFOLIO_KEY = "careerpack:demo:portfolio";

interface PortfolioHook {
  items: PortfolioItem[];
  isLoading: boolean;
  create: (values: PortfolioFormValues) => Promise<void>;
  update: (
    id: PortfolioItemId,
    values: Partial<PortfolioFormValues>,
  ) => Promise<void>;
  remove: (id: PortfolioItemId) => Promise<void>;
  toggleFeatured: (id: PortfolioItemId) => Promise<void>;
}

function portfolioFromSeed(s: DemoPortfolioSeed, now: number): PortfolioItem {
  const ts = now + s.dateOffsetDays * DAY;
  const iso = new Date(ts).toISOString().split("T")[0];
  // Branded Id<"…"> is just a string at runtime — cast through unknown so
  // downstream consumers that call APIs with this id never run (we branch
  // on isDemo before any Convex call).
  return {
    _id: s.id as unknown as Id<"portfolioItems">,
    _creationTime: ts,
    userId: "demo" as unknown as Id<"users">,
    title: s.title,
    description: s.description,
    category: s.category,
    coverEmoji: s.coverEmoji,
    coverGradient: s.coverGradient,
    link: s.link,
    techStack: s.techStack,
    date: iso,
    featured: s.featured,
    coverUrl: null,
  };
}

export function useDemoPortfolioOverlay(): PortfolioHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoPortfolioSeed[]>(
    PORTFOLIO_KEY,
    [...DEMO_PORTFOLIO],
  );
  const now = Date.now();
  const items = useMemo(
    () => seeds.map((s) => portfolioFromSeed(s, now)),
    [seeds, now],
  );

  const create: PortfolioHook["create"] = useCallback(
    async (values) => {
      const offset = Math.round(
        (new Date(values.date).getTime() - Date.now()) / DAY,
      );
      setSeeds((prev) => [
        ...prev,
        {
          id: `pf-${Date.now().toString(36)}`,
          title: values.title.trim(),
          description: values.description.trim(),
          category: values.category,
          link: values.link.trim() || undefined,
          techStack: values.techStack.filter((t) => t.trim().length > 0),
          dateOffsetDays: offset,
          featured: values.featured,
          coverEmoji: values.coverEmoji || "📄",
          coverGradient: values.coverGradient || "from-slate-500 to-slate-700",
        },
      ]);
      notify.success("Tersimpan di mode demo (lokal)");
    },
    [setSeeds],
  );

  const update: PortfolioHook["update"] = useCallback(
    async (id, values) => {
      setSeeds((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const next: DemoPortfolioSeed = { ...s };
          if (values.title !== undefined) next.title = values.title.trim();
          if (values.description !== undefined)
            next.description = values.description.trim();
          if (values.category !== undefined) next.category = values.category;
          if (values.coverEmoji !== undefined)
            next.coverEmoji = values.coverEmoji;
          if (values.coverGradient !== undefined)
            next.coverGradient = values.coverGradient;
          if (values.link !== undefined)
            next.link = values.link.trim() || undefined;
          if (values.techStack !== undefined) next.techStack = values.techStack;
          if (values.date !== undefined) {
            next.dateOffsetDays = Math.round(
              (new Date(values.date).getTime() - Date.now()) / DAY,
            );
          }
          if (values.featured !== undefined) next.featured = values.featured;
          return next;
        }),
      );
    },
    [setSeeds],
  );

  const remove: PortfolioHook["remove"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  const toggleFeatured: PortfolioHook["toggleFeatured"] = useCallback(
    async (id) => {
      setSeeds((prev) =>
        prev.map((s) => (s.id === id ? { ...s, featured: !s.featured } : s)),
      );
    },
    [setSeeds],
  );

  return { items, isLoading: false, create, update, remove, toggleFeatured };
}

// ---------------------------------------------------------------------
// Contacts (Networking) overlay — output shape matches `Contact`.
// ---------------------------------------------------------------------

const CONTACTS_KEY = "careerpack:demo:contacts";

interface ContactsHook {
  contacts: Contact[];
  isLoading: boolean;
  create: (values: ContactFormValues) => Promise<void>;
  update: (id: ContactId, values: Partial<ContactFormValues>) => Promise<void>;
  remove: (id: ContactId) => Promise<void>;
  toggleFavorite: (id: ContactId) => Promise<void>;
  bumpInteraction: (id: ContactId) => Promise<void>;
}

function contactFromSeed(s: DemoContactSeed, now: number): Contact {
  const ts = now - s.lastInteractionDays * DAY;
  return {
    _id: s.id as unknown as Id<"contacts">,
    _creationTime: ts,
    userId: "demo" as unknown as Id<"users">,
    name: s.name,
    role: s.role,
    company: s.company,
    position: s.position,
    email: s.email,
    linkedinUrl: s.linkedinUrl,
    notes: s.notes,
    avatarEmoji: s.avatarEmoji,
    avatarHue: s.avatarHue,
    lastInteraction: ts,
    favorite: s.favorite,
  };
}

export function useDemoContactsOverlay(): ContactsHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoContactSeed[]>(
    CONTACTS_KEY,
    [...DEMO_CONTACTS],
  );
  const now = Date.now();
  const contacts = useMemo(
    () => seeds.map((s) => contactFromSeed(s, now)),
    [seeds, now],
  );

  const create: ContactsHook["create"] = useCallback(
    async (values) => {
      setSeeds((prev) => [
        ...prev,
        {
          id: `c-${Date.now().toString(36)}`,
          name: values.name.trim(),
          role: values.role,
          company: values.company.trim() || undefined,
          position: values.position.trim() || undefined,
          email: values.email.trim() || undefined,
          linkedinUrl: values.linkedinUrl.trim() || undefined,
          notes: values.notes.trim() || undefined,
          avatarEmoji: values.avatarEmoji || undefined,
          avatarHue: values.avatarHue || undefined,
          lastInteractionDays: 0,
          favorite: values.favorite,
        },
      ]);
      notify.success("Tersimpan di mode demo (lokal)");
    },
    [setSeeds],
  );

  const update: ContactsHook["update"] = useCallback(
    async (id, values) => {
      setSeeds((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const next: DemoContactSeed = { ...s };
          if (values.name !== undefined) next.name = values.name.trim();
          if (values.role !== undefined) next.role = values.role;
          if (values.company !== undefined)
            next.company = values.company.trim() || undefined;
          if (values.position !== undefined)
            next.position = values.position.trim() || undefined;
          if (values.email !== undefined)
            next.email = values.email.trim() || undefined;
          if (values.linkedinUrl !== undefined)
            next.linkedinUrl = values.linkedinUrl.trim() || undefined;
          if (values.notes !== undefined)
            next.notes = values.notes.trim() || undefined;
          if (values.avatarEmoji !== undefined)
            next.avatarEmoji = values.avatarEmoji;
          if (values.avatarHue !== undefined) next.avatarHue = values.avatarHue;
          if (values.favorite !== undefined) next.favorite = values.favorite;
          return next;
        }),
      );
    },
    [setSeeds],
  );

  const remove: ContactsHook["remove"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  const toggleFavorite: ContactsHook["toggleFavorite"] = useCallback(
    async (id) => {
      setSeeds((prev) =>
        prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)),
      );
    },
    [setSeeds],
  );

  const bumpInteraction: ContactsHook["bumpInteraction"] = useCallback(
    async (id) => {
      setSeeds((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, lastInteractionDays: 0 } : s,
        ),
      );
    },
    [setSeeds],
  );

  return {
    contacts,
    isLoading: false,
    create,
    update,
    remove,
    toggleFavorite,
    bumpInteraction,
  };
}

// ---------------------------------------------------------------------
// CV overlay
// ---------------------------------------------------------------------

const CV_KEY = "careerpack:demo:cv";

interface CVHook {
  cvData: CVData | null;
  saveCV: (data: CVData) => Promise<boolean>;
  isLoading: boolean;
}

function defaultCVData(): CVData {
  return {
    profile: {
      name: DEMO_CV.personalInfo.fullName,
      email: DEMO_CV.personalInfo.email,
      phone: DEMO_CV.personalInfo.phone,
      location: DEMO_CV.personalInfo.location,
      linkedin: DEMO_CV.personalInfo.linkedin,
      portfolio: DEMO_CV.personalInfo.portfolio,
      summary: DEMO_CV.personalInfo.summary,
      dateOfBirth: DEMO_CV.personalInfo.dateOfBirth,
      targetIndustry: "",
      experienceLevel: "fresh-graduate",
    },
    education: DEMO_CV.education.map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.field,
      startDate: e.startDate,
      endDate: e.endDate,
      gpa: e.gpa,
    })),
    experience: DEMO_CV.experience.map((e) => ({
      id: e.id,
      company: e.company,
      position: e.position,
      startDate: e.startDate,
      endDate: e.endDate ?? "",
      description: e.description,
      achievements: e.achievements,
    })),
    skills: DEMO_CV.skills.map((s) => ({
      id: s.id,
      name: s.name,
      category: "technical",
      proficiency: Math.max(1, Math.min(5, Math.round(s.proficiency / 20))) as
        | 1
        | 2
        | 3
        | 4
        | 5,
    })),
    certifications: DEMO_CV.certifications,
    projects: DEMO_CV.projects,
    displayPrefs: {
      showPicture: false,
      showAge: false,
      showGraduationYear: true,
      templateId: "modern",
    },
  };
}

export function useDemoCVOverlay(): CVHook {
  const [cv, setCV] = useLocalStorageState<CVData>(CV_KEY, defaultCVData());

  const saveCV: CVHook["saveCV"] = useCallback(
    async (data) => {
      setCV(data);
      notify.success("Tersimpan di mode demo (lokal)");
      return true;
    },
    [setCV],
  );

  return { cvData: cv, saveCV, isLoading: false };
}

// ---------------------------------------------------------------------
// Agenda overlay
// ---------------------------------------------------------------------

const AGENDA_KEY = "careerpack:demo:agenda";

export interface DemoAgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: DemoAgendaType;
  notes?: string;
}

interface AgendaHook {
  items: DemoAgendaItem[];
  isLoading: boolean;
  create: (input: Omit<DemoAgendaItem, "id">) => Promise<void>;
  remove: (id: string) => Promise<void>;
  update: (id: string, patch: Partial<Omit<DemoAgendaItem, "id">>) => Promise<void>;
}

function agendaFromSeed(s: DemoAgendaSeed, now: number): DemoAgendaItem {
  const ts = now + s.dateOffsetDays * DAY;
  return {
    id: s.id,
    title: s.title,
    date: new Date(ts).toISOString().split("T")[0],
    time: s.time,
    location: s.location,
    type: s.type,
    notes: s.notes,
  };
}

export function useDemoAgendaOverlay(): AgendaHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoAgendaSeed[]>(
    AGENDA_KEY,
    [...DEMO_AGENDA],
  );
  const now = Date.now();
  const items = useMemo(
    () => seeds.map((s) => agendaFromSeed(s, now)),
    [seeds, now],
  );

  const create: AgendaHook["create"] = useCallback(
    async (input) => {
      const offset = Math.round(
        (new Date(input.date).getTime() - Date.now()) / DAY,
      );
      setSeeds((prev) => [
        ...prev,
        {
          id: `ag-${Date.now().toString(36)}`,
          title: input.title,
          dateOffsetDays: offset,
          time: input.time,
          location: input.location,
          type: input.type,
          notes: input.notes,
        },
      ]);
      notify.success("Tersimpan di mode demo (lokal)");
    },
    [setSeeds],
  );

  const remove: AgendaHook["remove"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  const update: AgendaHook["update"] = useCallback(
    async (id, patch) => {
      setSeeds((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const next: DemoAgendaSeed = { ...s };
          if (patch.title !== undefined) next.title = patch.title;
          if (patch.time !== undefined) next.time = patch.time;
          if (patch.location !== undefined) next.location = patch.location;
          if (patch.type !== undefined) next.type = patch.type;
          if (patch.notes !== undefined) next.notes = patch.notes;
          if (patch.date !== undefined) {
            next.dateOffsetDays = Math.round(
              (new Date(patch.date).getTime() - Date.now()) / DAY,
            );
          }
          return next;
        }),
      );
    },
    [setSeeds],
  );

  return { items, isLoading: false, create, remove, update };
}

// ---------------------------------------------------------------------
// Notifications overlay — output shape matches Doc<"notifications">
// ---------------------------------------------------------------------

const NOTIFICATIONS_KEY = "careerpack:demo:notifications";

type NotificationDoc = Doc<"notifications">;

interface NotificationsHook {
  notifications: NotificationDoc[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: Id<"notifications">) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: Id<"notifications">) => Promise<void>;
  dismissAll: () => Promise<void>;
}

function notificationFromSeed(
  s: DemoNotificationSeed,
  now: number,
): NotificationDoc {
  const ts = now - s.hoursAgo * HOUR;
  return {
    _id: s.id as unknown as Id<"notifications">,
    _creationTime: ts,
    userId: "demo" as unknown as Id<"users">,
    type: s.type as DemoNotificationType,
    title: s.title,
    message: s.message,
    read: s.read,
    actionUrl: s.actionUrl,
  };
}

export function useDemoNotificationsOverlay(): NotificationsHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoNotificationSeed[]>(
    NOTIFICATIONS_KEY,
    [...DEMO_NOTIFICATIONS],
  );
  const now = Date.now();
  const notifications = useMemo(
    () => seeds.map((s) => notificationFromSeed(s, now)),
    [seeds, now],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead: NotificationsHook["markRead"] = useCallback(
    async (id) => {
      setSeeds((prev) =>
        prev.map((s) => (s.id === id ? { ...s, read: true } : s)),
      );
    },
    [setSeeds],
  );

  const markAllRead: NotificationsHook["markAllRead"] = useCallback(
    async () => {
      setSeeds((prev) => prev.map((s) => ({ ...s, read: true })));
    },
    [setSeeds],
  );

  const dismiss: NotificationsHook["dismiss"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  const dismissAll: NotificationsHook["dismissAll"] = useCallback(
    async () => {
      setSeeds(() => []);
    },
    [setSeeds],
  );

  return {
    notifications,
    unreadCount,
    isLoading: false,
    markRead,
    markAllRead,
    dismiss,
    dismissAll,
  };
}

// ---------------------------------------------------------------------
// Document checklist progress overlay (frontend template merged in
// component; we only persist completion + notes per id, keyed by the
// item id from `indonesianDocumentChecklist`).
// ---------------------------------------------------------------------

const CHECKLIST_KEY = "careerpack:demo:checklist";

export interface DemoChecklistMap {
  [id: string]: {
    completed: boolean;
    notes?: string;
    expiryDate?: string;
  };
}

interface ChecklistHook {
  progress: DemoChecklistMap;
  isLoading: boolean;
  toggle: (id: string) => void;
  setEntry: (
    id: string,
    patch: Partial<{ completed: boolean; notes: string; expiryDate: string }>,
  ) => void;
}

export function useDemoChecklistOverlay(): ChecklistHook {
  const seedMap: DemoChecklistMap = useMemo(() => {
    const m: DemoChecklistMap = {};
    for (const e of DEMO_CHECKLIST_PROGRESS) {
      m[e.id] = {
        completed: e.completed,
        notes: e.notes,
        expiryDate: e.expiryDate,
      };
    }
    return m;
  }, []);

  const [progress, setProgress] = useLocalStorageState<DemoChecklistMap>(
    CHECKLIST_KEY,
    seedMap,
  );

  const toggle: ChecklistHook["toggle"] = useCallback(
    (id) => {
      setProgress((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          completed: !prev[id]?.completed,
        },
      }));
    },
    [setProgress],
  );

  const setEntry: ChecklistHook["setEntry"] = useCallback(
    (id, patch) => {
      setProgress((prev) => ({
        ...prev,
        [id]: {
          completed: patch.completed ?? prev[id]?.completed ?? false,
          notes: patch.notes ?? prev[id]?.notes,
          expiryDate: patch.expiryDate ?? prev[id]?.expiryDate,
        },
      }));
    },
    [setProgress],
  );

  return { progress, isLoading: false, toggle, setEntry };
}

// ---------------------------------------------------------------------
// Profile overlay (used by ProfileSection in /settings)
// ---------------------------------------------------------------------

const PROFILE_KEY = "careerpack:demo:profile";

export interface DemoProfileState {
  fullName: string;
  phone: string;
  location: string;
  targetRole: string;
  experienceLevel: string;
  bio: string;
  skills: string[];
  interests: string[];
}

interface ProfileHook {
  profile: DemoProfileState;
  setProfile: (next: DemoProfileState) => void;
  save: (next: DemoProfileState) => Promise<void>;
}

const DEFAULT_PROFILE: DemoProfileState = {
  fullName: DEMO_PROFILE.fullName,
  phone: DEMO_PROFILE.phone,
  location: DEMO_PROFILE.location,
  targetRole: DEMO_PROFILE.targetRole,
  experienceLevel: DEMO_PROFILE.experienceLevel,
  bio: DEMO_PROFILE.bio,
  skills: DEMO_PROFILE.skills,
  interests: DEMO_PROFILE.interests,
};

export function useDemoProfileOverlay(): ProfileHook {
  const [profile, setProfileState] = useLocalStorageState<DemoProfileState>(
    PROFILE_KEY,
    DEFAULT_PROFILE,
  );

  const save: ProfileHook["save"] = useCallback(
    async (next) => {
      setProfileState(next);
      notify.success("Profil tersimpan (mode demo lokal)");
    },
    [setProfileState],
  );

  return { profile, setProfile: setProfileState, save };
}

// ---------------------------------------------------------------------
// Personal Branding overlay
// ---------------------------------------------------------------------

const PB_KEY = "careerpack:demo:pb";

interface PBHook {
  state: DemoPBSeed;
  set: <K extends keyof DemoPBSeed>(key: K, value: DemoPBSeed[K]) => void;
  save: (next: DemoPBSeed) => Promise<void>;
}

export function useDemoPBOverlay(): PBHook {
  const [state, setState] = useLocalStorageState<DemoPBSeed>(PB_KEY, DEMO_PB);

  const set: PBHook["set"] = useCallback(
    (key, value) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [setState],
  );

  const save: PBHook["save"] = useCallback(
    async (next) => {
      setState(next);
      notify.success("Tersimpan (mode demo lokal)");
    },
    [setState],
  );

  return { state, set, save };
}
