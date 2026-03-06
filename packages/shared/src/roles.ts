export const PrimaryRole = {
  PLAYER: "PLAYER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
} as const;

export const SubRole = {
  AGENT: "AGENT",
  PHYSIO: "PHYSIO",
  COACH: "COACH",
  NUTRITIONIST: "NUTRITIONIST",
  PITCH_MANAGER: "PITCH_MANAGER",
} as const;

export type PrimaryRole = (typeof PrimaryRole)[keyof typeof PrimaryRole];
export type SubRole = (typeof SubRole)[keyof typeof SubRole];

export type ScopeType = "CLUB" | "SQUAD" | "PLAYER";
