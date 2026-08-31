import {
  FileText, GraduationCap, Briefcase, Wallet, Heart, Plane,
  ShieldCheck, Languages, Scale, Award, Home, Stamp,
} from "lucide-react";

// Covers every `category` value used across convex/_seeds/documents/*.ts —
// keep this in sync so the filter never falls back to the generic FileText
// icon for a category that actually has a template document using it.
export const categoryIcons: Record<string, React.ElementType> = {
  identity: FileText,
  education: GraduationCap,
  professional: Briefcase,
  career: Briefcase,
  employment: Briefcase,
  financial: Wallet,
  health: Heart,
  travel: Plane,
  visa: Stamp,
  insurance: ShieldCheck,
  language: Languages,
  legal: Scale,
  qualification: Award,
  settlement: Home,
};
