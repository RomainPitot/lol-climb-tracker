import {
  LayoutDashboard,
  Users,
  Bot,
  Shuffle,
  Smartphone,
  GraduationCap,
  Settings as SettingsIcon,
} from "lucide-react";

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "champions", label: "Champions", icon: Users },
  { id: "tierlist", label: "Tierlist", icon: Shuffle },
  { id: "champselect", label: "Phone control", icon: Smartphone },
  { id: "coach", label: "Coach IA", icon: Bot },
  { id: "learn", label: "Learn", icon: GraduationCap },
  { id: "settings", label: "Paramètres", icon: SettingsIcon },
];
