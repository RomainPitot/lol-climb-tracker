import { LayoutDashboard, Users, Bot, Shuffle, Smartphone, GraduationCap } from "lucide-react";

/** Onglets principaux uniquement — les Paramètres ne sont plus un onglet mais une roue
 * crantée discrète en bas de la sidebar (voir Sidebar.jsx) : on y va rarement, ils n'ont
 * pas à peser autant qu'une vraie section dans la navigation. */
export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "champions", label: "Champions", icon: Users },
  { id: "tierlist", label: "Tierlist", icon: Shuffle },
  { id: "champselect", label: "Phone control", icon: Smartphone },
  { id: "coach", label: "Coach IA", icon: Bot },
  { id: "learn", label: "Learn", icon: GraduationCap },
];
