import api from "./axios";

/** Adjust these types to match your backend response shape exactly */
export type PlayerProfile = {
  id: string;
  name: string;
  club?: string;
  avatarUrl?: string;
};

export type PlayerSummary = {
  seasonMinutes: number | null;
  goals: number | null;
  assists: number | null;
  fitnessScore: number | null;
  marketValueAI: number | null;
};

export type Recommendation = { id: string; text: string };
export type QuickTask = { id: string; title: string; done: boolean };
export type UpdateItem = { id: string; text: string; createdAt: string };
export type HealthSnapshot = {
  currentInjury: string | null;
  recoveryEta: string | null;
  status?: string | null;
};

export async function getPlayerMe() {
  // ✅ change endpoint if yours differs
  const { data } = await api.get<PlayerProfile>("/api/player/me");
  return data;
}

export async function getPlayerSummary() {
  const { data } = await api.get<PlayerSummary>("/api/player/summary");
  return data;
}

export async function getPlayerRecommendations() {
  const { data } = await api.get<Recommendation[]>("/api/player/recommendations");
  return data;
}

export async function getPlayerQuickTasks() {
  const { data } = await api.get<QuickTask[]>("/api/player/tasks");
  return data;
}

export async function toggleTask(taskId: string) {
  const { data } = await api.patch<QuickTask>(`/api/player/tasks/${taskId}/toggle`);
  return data;
}

export async function getPlayerRecentUpdates() {
  const { data } = await api.get<UpdateItem[]>("/api/player/updates");
  return data;
}

export async function getPlayerHealthSnapshot() {
  const { data } = await api.get<HealthSnapshot>("/api/player/health");
  return data;
}

/** Upload Media (clips/images) */
export async function uploadPlayerMedia(files: File[]) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const { data } = await api.post("/api/player/media/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}