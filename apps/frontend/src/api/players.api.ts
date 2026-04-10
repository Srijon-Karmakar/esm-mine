import { http } from "./http";

export type PlayerProfile = {
  id: string;
  userId: string;
  dob: string | null;
  nationality: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dominantFoot: "RIGHT" | "LEFT" | "BOTH" | null;
  positions: string[];
  wellnessStatus: "FIT" | "LIMITED" | "UNAVAILABLE" | null;
  readinessScore: number | null;
  energyLevel: number | null;
  sorenessLevel: number | null;
  sleepHours: number | null;
  healthNotes: string | null;
  healthUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
  };
};

export type PlayerProfileDto = {
  dob?: string | null;
  nationality?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  dominantFoot?: "RIGHT" | "LEFT" | "BOTH" | null;
  positions?: string[];
  wellnessStatus?: "FIT" | "LIMITED" | "UNAVAILABLE" | null;
  readinessScore?: number | null;
  energyLevel?: number | null;
  sorenessLevel?: number | null;
  sleepHours?: number | null;
  healthNotes?: string | null;
};

export async function getMyPlayerProfile() {
  const { data } = await http.get<{ profile: PlayerProfile | null }>("/players/me");
  return data.profile;
}

export async function updateMyPlayerProfile(payload: PlayerProfileDto) {
  const { data } = await http.patch<{ profile: PlayerProfile }>("/players/me", payload);
  return data.profile;
}
