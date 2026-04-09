import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMe } from "../../../hooks/useMe";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
} from "../../admin/admin-ui";
import { getMyPlayerProfile, updateMyPlayerProfile } from "../../../api/players.api";
import type { PlayerProfileDto } from "../../../api/players.api";
import { calculateAge, calculateBmi, normalizePositions, toDateInput } from "../../../utils/playerProfile";

type FormValues = {
  dob: string;
  nationality: string;
  heightCm: string;
  weightKg: string;
  dominantFoot: "RIGHT" | "LEFT" | "BOTH" | "";
  positions: string;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const profileQuery = useQuery({
    queryKey: ["player-profile"],
    queryFn: getMyPlayerProfile,
    staleTime: 30_000,
  });

  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      dob: "",
      nationality: "",
      heightCm: "",
      weightKg: "",
      dominantFoot: "",
      positions: "",
    },
  });

  useEffect(() => {
    const profile = profileQuery.data;
    reset({
      dob: toDateInput(profile?.dob),
      nationality: profile?.nationality || "",
      heightCm: profile?.heightCm ? String(profile.heightCm) : "",
      weightKg: profile?.weightKg ? String(profile.weightKg) : "",
      dominantFoot: profile?.dominantFoot || "",
      positions: profile?.positions?.join(", ") || "",
    });
  }, [profileQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (payload: PlayerProfileDto) => updateMyPlayerProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setMessage({ type: "ok", text: "Profile saved. That data now powers the dashboards." });
    },
    onError(error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setMessage({
        type: "err",
        text: err?.response?.data?.message || err?.message || "Unable to save profile.",
      });
    },
  });

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    const payload: PlayerProfileDto = {
      dob: values.dob ? new Date(values.dob).toISOString() : null,
      nationality: values.nationality?.trim() || null,
      heightCm: values.heightCm ? Number(values.heightCm) : null,
      weightKg: values.weightKg ? Number(values.weightKg) : null,
      dominantFoot: values.dominantFoot || null,
      positions: normalizePositions(values.positions),
    };
    mutation.mutate(payload);
  });

  const profile = profileQuery.data;
  const age = useMemo(() => calculateAge(profile?.dob), [profile?.dob]);
  const bmi = useMemo(
    () => calculateBmi(profile?.heightCm ?? null, profile?.weightKg ?? null),
    [profile?.heightCm, profile?.weightKg]
  );

  const positionsWatch = watch("positions");
  const livePositions = normalizePositions(positionsWatch);
  const positionsForDisplay = livePositions.length
    ? livePositions
    : profile?.positions || [];

  if (profileQuery.isLoading || meQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading profile data...
        </div>
      </PageWrap>
    );
  }




  return (
    <PageWrap>
      <Hero
        title="Player Profile"
        subtitle="Your bio data directly feeds the intelligence layer and dashboard analytics."
        right={<DotTag tone="ok">LIVE</DotTag>}
      />

      {message && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{
            borderColor: message.type === "ok" ? "rgba(34,197,94,.8)" : adminCardBorder,
            background: message.type === "ok" ? "rgba(16,185,129,.12)" : "rgba(255,255,255,.65)",
          }}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Section
          title="Edit Profile"
          subtitle="Update your baseline metrics so the insights engine stays accurate."
        >
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Full name
                <input
                  type="text"
                  value={meQuery.data?.user?.fullName || ""}
                  readOnly
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                  placeholder="Set via account onboarding"
                />
              </label>
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Email
                <input
                  type="email"
                  value={meQuery.data?.user?.email || ""}
                  readOnly
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Date of birth
                <input
                  type="date"
                  {...register("dob")}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Nationality
                <input
                  type="text"
                  {...register("nationality")}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                  placeholder="India, Brazil, France..."
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Height (cm)
                <input
                  type="number"
                  min={120}
                  max={250}
                  {...register("heightCm")}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Weight (kg)
                <input
                  type="number"
                  min={30}
                  max={200}
                  {...register("weightKg")}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Dominant foot
                <select
                  {...register("dominantFoot")}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                >
                  <option value="">Not specified</option>
                  <option value="RIGHT">Right</option>
                  <option value="LEFT">Left</option>
                  <option value="BOTH">Both / Ambidextrous</option>
                </select>
              </label>
            </div>

            <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
              Positions
              <input
                type="text"
                {...register("positions")}
                className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                style={{ borderColor: adminCardBorder }}
                placeholder="e.g., ST, CAM, RW"
              />
              <span className="text-[10px] text-[rgb(var(--muted))]">
                Comma‑separate roles (higher values boost the scouting insights).
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[rgb(var(--muted))]">
                This data is stored securely and contributes to the dashboards you see
                in the insights, marketplace, and injury feeds.
              </p>
              <button
                type="submit"
                disabled={mutation.status === "pending"}
                className="rounded-full bg-[rgb(var(--primary))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--primary-2))] shadow-lg transition hover:opacity-90 disabled:opacity-60"
              >
                {mutation.status === "pending" ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        </Section>

        <Section
          title="Data Insights"
          subtitle="Computed metrics that inform the dashboards."
          dark
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Age" value={age ?? "-"} />
            <Stat label="BMI" value={bmi ? `${bmi} kg/m²` : "-"} />
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-[rgb(var(--muted))]">
              <span>Positions submitted</span>
              <DotTag tone="ok">
                {positionsForDisplay.length ? positionsForDisplay.join(", ") : "No positions"}
              </DotTag>
            </div>
            <p className="text-sm text-white/70">
              The squad and marketplace grids reference these positions when grouping
              players and seeding match pairings.
            </p>
            {profile?.updatedAt && (
              <p className="text-xs text-white/50">
                Last saved: {new Date(profile.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </Section>
      </div>
    </PageWrap>
  );

}
