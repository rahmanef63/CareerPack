import {
  BarChart3, BookOpen, Briefcase, Building2, Calculator, Camera, ChefHat,
  Cloud, Code, DollarSign, FileText, FlaskConical, Gavel, Globe,
  GraduationCap, Handshake, Headphones, Heart, HeartHandshake, Image,
  Kanban, Landmark, Layout, Megaphone, Mic, Palette, PiggyBank,
  Server, ShoppingCart, Smartphone, Star, Stethoscope, Swords, Target,
  TrendingUp, Trophy, Truck, UserCog, Users, Video,
} from "lucide-react";

// Expanded for all 42+ template categories.
export const iconMap: Record<string, React.ElementType> = {
  Layout, Code, Server, Cloud, BarChart3, Palette, Smartphone,
  TrendingUp, FileText, Calculator, Users, Kanban, Handshake,
  Headphones, Image, Video, GraduationCap, Heart, Building2,
  Truck, Landmark, Briefcase, DollarSign, PiggyBank, UserCog,
  Megaphone, Camera, Mic, Globe, Stethoscope, ShoppingCart,
  ChefHat, HeartHandshake, Gavel, FlaskConical, BookOpen,
  Target, Star, Trophy, Swords,
};

export const DOMAIN_LABELS: Record<string, string> = {
  tech: "Teknologi",
  business: "Bisnis",
  creative: "Kreatif",
  education: "Pendidikan",
  health: "Kesehatan",
  finance: "Keuangan",
  hr: "SDM",
  operations: "Operasional",
  government: "Pemerintahan",
  social: "Sosial",
  hospitality: "Hospitality",
};

// Shown when DB has no templates yet.
export const FALLBACK_CATEGORIES = [
  { id: 'frontend', name: 'Frontend Dev', icon: 'Layout', color: 'bg-blue-500', description: 'HTML, CSS, JavaScript, React', domain: 'tech', nodeCount: 5, totalHours: 170, isSystem: true as const, authorName: null as string | null },
  { id: 'backend', name: 'Backend Dev', icon: 'Server', color: 'bg-green-500', description: 'Node.js, Express, REST API', domain: 'tech', nodeCount: 4, totalHours: 110, isSystem: true as const, authorName: null as string | null },
];
