import { Flag, Medal, Flame, Zap, Gem, Crown, Sparkles, Target } from "lucide-react";
import { APEX } from "../constants/ranks.js";
import { rankValue } from "./rank.js";
import { streaksOf, lpSince } from "./stats.js";
import { computeGoalProgress } from "./goals.js";

export function computeGeneralAchievements(sorted, currentRank, goals) {
  const streaks = streaksOf(sorted);
  const lpWeek = lpSince(sorted, Date.now() - 7 * 86400000);

  return [
    { id: "first", label: "Premier pas", icon: Flag, unlocked: sorted.length >= 1 },
    { id: "g25", label: "25 games trackées", icon: Medal, unlocked: sorted.length >= 25 },
    { id: "g100", label: "100 games trackées", icon: Medal, unlocked: sorted.length >= 100 },
    { id: "streak5", label: "Série de 5 victoires", icon: Flame, unlocked: streaks.bestWin >= 5 },
    { id: "streak10", label: "Série de 10 victoires", icon: Zap, unlocked: streaks.bestWin >= 10 },
    {
      id: "diamond",
      label: "Rang Diamant atteint",
      icon: Gem,
      unlocked: rankValue(currentRank.tier, currentRank.div) >= rankValue("Diamant", "IV"),
    },
    {
      id: "master",
      label: "Rang Maître atteint",
      icon: Crown,
      unlocked: APEX.includes(currentRank.tier),
    },
    { id: "weekclimb", label: "+100 LP en une semaine", icon: Sparkles, unlocked: lpWeek >= 100 },
    {
      id: "goal",
      label: "Un objectif atteint",
      icon: Target,
      unlocked: (goals || []).some((g) => computeGoalProgress(g, sorted).met),
    },
  ];
}
