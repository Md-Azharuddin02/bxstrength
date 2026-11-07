import { BodyStat } from "../../types";
import { STORAGE_KEYS, getItem, setItem } from "../core/storage";
import { getApiUrl, apiFetch } from "../core/http";

const BODY_STATS_URL = "/api/body-stats";

const responseError = async (res: Response, fallback: string) => {
  const data = await res.json().catch(() => ({}));
  return new Error(data.error || fallback);
};

// Moves entries saved by the old browser-only version to the server, once.
const importLocalStats = async (userId: string) => {
  const saved = getItem<BodyStat[]>(STORAGE_KEYS.BODY_STATS, []);
  if (!Array.isArray(saved)) return;

  for (const stat of saved.filter((s) => s.userId === userId)) {
    const res = await apiFetch(getApiUrl(BODY_STATS_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        importId: stat.id,
        date: stat.date,
        weightKg: stat.weightKg,
        heightCm: stat.heightCm,
        bodyFatPercentage: stat.bodyFatPercentage,
        chestCm: stat.chestCm,
        waistCm: stat.waistCm,
        bicepsCm: stat.bicepsCm,
        thighsCm: stat.thighsCm,
      }),
    });
    // A 400 can never succeed, so drop that entry. Anything else is retried on the next load.
    if (!res.ok && res.status !== 400) return;
    setItem(
      STORAGE_KEYS.BODY_STATS,
      getItem<BodyStat[]>(STORAGE_KEYS.BODY_STATS, []).filter((s) => s.id !== stat.id),
    );
  }
};

export const bodyStatsApi = {
  async fetchBodyStats(userId: string): Promise<BodyStat[]> {
    await importLocalStats(userId).catch((err) =>
      console.warn("Body stats import will retry:", err?.message),
    );
    const res = await apiFetch(getApiUrl(BODY_STATS_URL));
    if (!res.ok) throw await responseError(res, "Could not load body stats.");
    return res.json();
  },

  async addBodyStat(
    stat: Omit<BodyStat, "id" | "userId" | "date" | "bmi" | "bmiCategory">,
  ): Promise<BodyStat> {
    const res = await apiFetch(getApiUrl(BODY_STATS_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stat),
    });
    if (!res.ok) throw await responseError(res, "Could not save body stats.");
    const saved: BodyStat = await res.json();

    const current = this.getCurrentUser();
    if (current) {
      this.addAuditLog(
        current.id,
        current.name,
        current.role,
        "LOG_BODY_STAT",
        `Logged body weight ${saved.weightKg}kg, BMI ${saved.bmi} (${saved.bmiCategory})`,
      );
    }

    return saved;
  },
};
