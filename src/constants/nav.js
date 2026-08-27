import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Users2,
  Bot,
  Shuffle,
  Settings as SettingsIcon,
} from "lucide-react";

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "add", label: "Ajouter une game", icon: PlusCircle },
  { id: "champions", label: "Champions", icon: Users },
  { id: "tierlist", label: "Tierlist", icon: Shuffle },
  { id: "sessions", label: "Sessions", icon: Users2 },
  { id: "coach", label: "Coach IA", icon: Bot },
  { id: "settings", label: "Paramètres", icon: SettingsIcon },
];
