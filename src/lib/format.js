export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Un enregistrement de game n'a que `date` + `time` : reconstruit l'instant complet. */
export const gameDate = (g) => new Date(`${g.date}T${g.time || "00:00"}`);
export const gameTime = (g) => gameDate(g).getTime();
