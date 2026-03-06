import { z } from "zod";
import { PrimaryRole, SubRole } from "./roles";

export const RoleSetSchema = z.object({
  primary: z.enum([PrimaryRole.PLAYER, PrimaryRole.ADMIN, PrimaryRole.MANAGER]),
  sub: z
    .array(
      z.enum([
        SubRole.AGENT,
        SubRole.PHYSIO,
        SubRole.COACH,
        SubRole.NUTRITIONIST,
        SubRole.PITCH_MANAGER,
      ])
    )
    .optional(),
});

export type RoleSetDTO = z.infer<typeof RoleSetSchema>;
