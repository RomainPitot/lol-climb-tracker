import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Bot,
  Shuffle,
  Crosshair,
  Settings as SettingsIcon,
} from "lucide-react";

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "add", label: "Ajouter une game", icon: PlusCircle },
  { id: "champions", label: "Champions", icon: Users },
  { id: "tierlist", label: "Tierlist", icon: Shuffle },
  { id: "champselect", label: "Sélection de champion", icon: Crosshair },
  { id: "coach", label: "Coach IA", icon: Bot },
  { id: "settings", label: "Paramètres", icon: SettingsIcon },
];
