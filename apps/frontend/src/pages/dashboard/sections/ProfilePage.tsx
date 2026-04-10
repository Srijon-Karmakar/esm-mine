import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMe } from '../../../hooks/useMe';
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from '../../admin/admin-ui';
import { getMyPlayerProfile, updateMyPlayerProfile } from '../../../api/players.api';
import type { PlayerProfileDto } from '../../../api/players.api';
import {
  calculateAge,
  calculateBmi,
  normalizePositions,
  toDateInput,
} from '../../../utils/playerProfile';

type FormValues = {
  dob: string;
  nationality: string;
  heightCm: string;
  weightKg: string;
  dominantFoot: 'RIGHT' | 'LEFT' | 'BOTH' | '';
  positions: string;
  wellnessStatus: 'FIT' | 'LIMITED' | 'UNAVAILABLE' | '';
  readinessScore: string;
  energyLevel: string;
  sorenessLevel: string;
  sleepHours: string;
  healthNotes: string;
};

function toNumberOrNull(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const profileQuery = useQuery({
    queryKey: ['player-profile'],
    queryFn: getMyPlayerProfile,
    staleTime: 30_000,
  });

  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      dob: '',
      nationality: '',
      heightCm: '',
      weightKg: '',
      dominantFoot: '',
      positions: '',
      wellnessStatus: '',
      readinessScore: '',
      energyLevel: '',
      sorenessLevel: '',
      sleepHours: '',
      healthNotes: '',
    },
  });

  useEffect(() => {
    const profile = profileQuery.data;
    reset({
      dob: toDateInput(profile?.dob),
      nationality: profile?.nationality || '',
      heightCm: profile?.heightCm ? String(profile.heightCm) : '',
      weightKg: profile?.weightKg ? String(profile.weightKg) : '',
      dominantFoot: profile?.dominantFoot || '',
      positions: profile?.positions?.join(', ') || '',
      wellnessStatus: profile?.wellnessStatus || '',
      readinessScore:
        typeof profile?.readinessScore === 'number' ? String(profile.readinessScore) : '',
      energyLevel:
        typeof profile?.energyLevel === 'number' ? String(profile.energyLevel) : '',
      sorenessLevel:
        typeof profile?.sorenessLevel === 'number' ? String(profile.sorenessLevel) : '',
      sleepHours:
        typeof profile?.sleepHours === 'number' ? String(profile.sleepHours) : '',
      healthNotes: profile?.healthNotes || '',
    });
  }, [profileQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (payload: PlayerProfileDto) => updateMyPlayerProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setMessage({
        type: 'ok',
        text: 'Profile and health check-in saved. Selection tools will use the latest availability data.',
      });
    },
    onError(error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setMessage({
        type: 'err',
        text: err?.response?.data?.message || err?.message || 'Unable to save profile.',
      });
    },
  });

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    const payload: PlayerProfileDto = {
      dob: values.dob ? new Date(values.dob).toISOString() : null,
      nationality: values.nationality?.trim() || null,
      heightCm: toNumberOrNull(values.heightCm),
      weightKg: toNumberOrNull(values.weightKg),
      dominantFoot: values.dominantFoot || null,
      positions: normalizePositions(values.positions),
      wellnessStatus: values.wellnessStatus || null,
      readinessScore: toNumberOrNull(values.readinessScore),
      energyLevel: toNumberOrNull(values.energyLevel),
      sorenessLevel: toNumberOrNull(values.sorenessLevel),
      sleepHours: toNumberOrNull(values.sleepHours),
      healthNotes: values.healthNotes?.trim() || null,
    };
    mutation.mutate(payload);
  });

  const profile = profileQuery.data;
  const age = useMemo(() => calculateAge(profile?.dob), [profile?.dob]);
  const bmi = useMemo(
    () => calculateBmi(profile?.heightCm ?? null, profile?.weightKg ?? null),
    [profile?.heightCm, profile?.weightKg]
  );

  const positionsWatch = watch('positions');
  const readinessWatch = watch('readinessScore');
  const energyWatch = watch('energyLevel');
  const sorenessWatch = watch('sorenessLevel');
  const sleepWatch = watch('sleepHours');
  const wellnessWatch = watch('wellnessStatus');
  const livePositions = normalizePositions(positionsWatch);
  const positionsForDisplay = livePositions.length ? livePositions : profile?.positions || [];

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
        subtitle="Baseline metrics and self-reported health now feed the squad selection workflow."
        right={<DotTag tone="ok">LIVE</DotTag>}
      />

      {message && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{
            borderColor: message.type === 'ok' ? 'rgba(34,197,94,.8)' : adminCardBorder,
            background: message.type === 'ok' ? 'rgba(16,185,129,.12)' : 'rgba(255,255,255,.65)',
          }}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Age" value={age ?? '-'} />
        <Stat label="BMI" value={bmi ? `${bmi} kg/m2` : '-'} />
        <Stat label="Readiness" value={readinessWatch || profile?.readinessScore || '-'} />
        <Stat label="Energy" value={energyWatch || profile?.energyLevel || '-'} />
        <Stat label="Soreness" value={sorenessWatch || profile?.sorenessLevel || '-'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Section
          title="Edit Profile"
          subtitle="Keep both bio data and the latest health check-in accurate before matchday."
        >
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Full name
                <input
                  type="text"
                  value={meQuery.data?.user?.fullName || ''}
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
                  value={meQuery.data?.user?.email || ''}
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
                  {...register('dob')}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Nationality
                <input
                  type="text"
                  {...register('nationality')}
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
                  {...register('heightCm')}
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
                  {...register('weightKg')}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Dominant foot
                <select
                  {...register('dominantFoot')}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                >
                  <option value="">Not specified</option>
                  <option value="RIGHT">Right</option>
                  <option value="LEFT">Left</option>
                  <option value="BOTH">Both</option>
                </select>
              </label>
            </div>

            <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
              Positions
              <input
                type="text"
                {...register('positions')}
                className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                style={{ borderColor: adminCardBorder }}
                placeholder="e.g. ST, CAM, RW"
              />
              <span className="text-[10px] text-[rgb(var(--muted))]">
                Comma-separate roles so squad builders can position you correctly.
              </span>
            </label>

            <div className="rounded-3xl border bg-[rgba(var(--primary),.06)] p-4" style={{ borderColor: adminCardBorder }}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-[rgb(var(--text))]">Health Check-In</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Coaches and admins will see this status beside your name during lineup selection.
                  </p>
                </div>
                <DotTag tone={wellnessWatch === 'UNAVAILABLE' ? 'danger' : wellnessWatch === 'LIMITED' ? 'warn' : 'ok'}>
                  {wellnessWatch || profile?.wellnessStatus || 'PENDING'}
                </DotTag>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Wellness status
                  <select
                    {...register('wellnessStatus')}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                  >
                    <option value="">Not submitted</option>
                    <option value="FIT">Fit</option>
                    <option value="LIMITED">Limited</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Readiness score (0-100)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register('readinessScore')}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                    placeholder="82"
                  />
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Energy (1-10)
                  <input
                    type="number"
                    min={1}
                    max={10}
                    {...register('energyLevel')}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                    placeholder="8"
                  />
                </label>
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Soreness (1-10)
                  <input
                    type="number"
                    min={1}
                    max={10}
                    {...register('sorenessLevel')}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                    placeholder="3"
                  />
                </label>
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Sleep hours
                  <input
                    type="number"
                    min={0}
                    max={24}
                    step="0.5"
                    {...register('sleepHours')}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                    placeholder="7.5"
                  />
                </label>
              </div>

              <label className="mt-3 grid gap-1 text-xs text-[rgb(var(--muted))]">
                Notes for staff
                <textarea
                  {...register('healthNotes')}
                  rows={4}
                  className="rounded-2xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))] outline-none"
                  style={{ borderColor: adminCardBorder }}
                  placeholder="Any tightness, fatigue, or restrictions to mention before selection."
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[rgb(var(--muted))]">
                The saved profile powers the squad workspace, medical dashboards, and readiness checks.
              </p>
              <button
                type="submit"
                disabled={mutation.status === 'pending'}
                className="rounded-full bg-[rgb(var(--primary))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--primary-2))] shadow-lg transition hover:opacity-90 disabled:opacity-60"
              >
                {mutation.status === 'pending' ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </Section>

        <Section title="Live Insights" subtitle="What staff will read from your latest profile." dark>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="BMI" value={bmi ? `${bmi} kg/m2` : '-'} />
            <Stat label="Sleep" value={sleepWatch || profile?.sleepHours || '-'} />
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-[rgb(var(--muted))]">
              <span>Positions submitted</span>
              <DotTag tone="ok">
                {positionsForDisplay.length ? positionsForDisplay.join(', ') : 'No positions'}
              </DotTag>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-white/80">
              <p className="font-semibold text-white">Latest readiness snapshot</p>
              <p className="mt-1 text-xs text-white/70">
                Wellness: {wellnessWatch || profile?.wellnessStatus || 'Not submitted'} | Readiness:{' '}
                {readinessWatch || profile?.readinessScore || '-'} | Energy {energyWatch || profile?.energyLevel || '-'} | Soreness{' '}
                {sorenessWatch || profile?.sorenessLevel || '-'}
              </p>
              <p className="mt-2 text-xs text-white/60">
                Last health check: {formatDateTime(profile?.healthUpdatedAt)}
              </p>
            </div>
            <p className="text-sm text-white/70">
              If you are not fully fit, update the health check before matchday so staff can avoid risky selections.
            </p>
            {profile?.updatedAt && (
              <p className="text-xs text-white/50">
                Profile last saved: {new Date(profile.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </Section>
      </div>
    </PageWrap>
  );
}
