"use client";

import { useCallback } from "react";
import { notify } from "@/shared/lib/notify";
import { useLocalStorageState } from "../useLocalStorageState";
import { DEMO_PROFILE } from "@/shared/data/demoUser";

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
