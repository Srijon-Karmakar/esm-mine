type ActiveInjuryInput = {
  type?: string | null;
  severity?: string | null;
  endDate?: Date | null;
} | null;

type PlayerHealthProfileInput = {
  wellnessStatus?: string | null;
  hasInjury?: boolean | null;
  readinessScore?: number | null;
  energyLevel?: number | null;
  sorenessLevel?: number | null;
  sleepHours?: number | null;
  healthUpdatedAt?: Date | null;
};

export type PlayerAvailabilityStatus =
  | 'FIT'
  | 'CAUTION'
  | 'UNAVAILABLE'
  | 'NO_DATA';

export type PlayerHealthSummary = {
  status: PlayerAvailabilityStatus;
  selectionStatus: 'FIT' | 'NOT_FIT';
  label: string;
  note: string;
  isFitToPlay: boolean;
  selfReportedInjury: boolean;
  readinessScore: number | null;
  wellnessStatus: string | null;
  energyLevel: number | null;
  sorenessLevel: number | null;
  sleepHours: number | null;
  lastUpdatedAt: Date | null;
  activeInjury: ActiveInjuryInput;
};

function normalizeWellnessStatus(value?: string | null) {
  const normalized = String(value || '').trim().toUpperCase();
  if (
    normalized === 'FIT' ||
    normalized === 'LIMITED' ||
    normalized === 'UNAVAILABLE'
  ) {
    return normalized;
  }
  return null;
}

function hasHealthCheck(profile?: PlayerHealthProfileInput | null) {
  if (!profile) return false;
  return [
    profile.wellnessStatus,
    profile.hasInjury,
    profile.readinessScore,
    profile.energyLevel,
    profile.sorenessLevel,
    profile.sleepHours,
    profile.healthUpdatedAt,
  ].some((value) => value !== null && value !== undefined);
}

export function buildPlayerHealthSummary(
  profile?: PlayerHealthProfileInput | null,
  activeInjury?: ActiveInjuryInput,
): PlayerHealthSummary {
  const wellnessStatus = normalizeWellnessStatus(profile?.wellnessStatus);
  const selfReportedInjury = !!profile?.hasInjury;
  const readinessScore =
    typeof profile?.readinessScore === 'number' ? profile.readinessScore : null;
  const energyLevel =
    typeof profile?.energyLevel === 'number' ? profile.energyLevel : null;
  const sorenessLevel =
    typeof profile?.sorenessLevel === 'number' ? profile.sorenessLevel : null;
  const sleepHours =
    typeof profile?.sleepHours === 'number' ? profile.sleepHours : null;
  const lastUpdatedAt = profile?.healthUpdatedAt ?? null;

  const injurySeverity = String(activeInjury?.severity || '').toUpperCase();
  const hasInjury = !!activeInjury;
  const hasCheckIn = hasHealthCheck(profile);
  const staleCheckIn =
    !lastUpdatedAt ||
    Date.now() - lastUpdatedAt.getTime() > 72 * 60 * 60 * 1000;

  if (
    injurySeverity === 'HIGH' ||
    wellnessStatus === 'UNAVAILABLE' ||
    (readinessScore !== null && readinessScore <= 35) ||
    (energyLevel !== null && energyLevel <= 3) ||
    (sorenessLevel !== null && sorenessLevel >= 8)
  ) {
    return {
      status: 'UNAVAILABLE',
      selectionStatus: 'NOT_FIT',
      label: 'Not fit',
      note: hasInjury
        ? `${activeInjury?.type || 'Active injury'} requires clearance`
        : selfReportedInjury
          ? 'Player reported an injury and marked themselves not fit'
        : 'Latest health report marks this player unavailable',
      isFitToPlay: false,
      selfReportedInjury,
      readinessScore,
      wellnessStatus,
      energyLevel,
      sorenessLevel,
      sleepHours,
      lastUpdatedAt,
      activeInjury: activeInjury ?? null,
    };
  }

  if (
    hasInjury ||
    injurySeverity === 'MEDIUM' ||
    injurySeverity === 'LOW' ||
    wellnessStatus === 'LIMITED' ||
    (readinessScore !== null && readinessScore < 70) ||
    (energyLevel !== null && energyLevel <= 5) ||
    (sorenessLevel !== null && sorenessLevel >= 5) ||
    (sleepHours !== null && sleepHours < 5)
  ) {
    return {
      status: 'CAUTION',
      selectionStatus: 'NOT_FIT',
      label: 'Needs review',
      note: hasInjury
        ? `${activeInjury?.type || 'Active injury'} is still active`
        : selfReportedInjury
          ? 'Player reported an injury and needs staff review'
        : 'Player reported limited readiness for this fixture',
      isFitToPlay: false,
      selfReportedInjury,
      readinessScore,
      wellnessStatus,
      energyLevel,
      sorenessLevel,
      sleepHours,
      lastUpdatedAt,
      activeInjury: activeInjury ?? null,
    };
  }

  if (!hasCheckIn || staleCheckIn) {
    return {
      status: 'NO_DATA',
      selectionStatus: 'NOT_FIT',
      label: 'Check-in needed',
      note: 'No fresh health check-in available from the player',
      isFitToPlay: false,
      selfReportedInjury,
      readinessScore,
      wellnessStatus,
      energyLevel,
      sorenessLevel,
      sleepHours,
      lastUpdatedAt,
      activeInjury: activeInjury ?? null,
    };
  }

  return {
    status: 'FIT',
    selectionStatus: 'FIT',
    label: 'Fit to play',
    note: selfReportedInjury
      ? 'Player marked fit to play but reported an injury for staff awareness'
      : 'Latest health report looks clear for selection',
    isFitToPlay: true,
    selfReportedInjury,
    readinessScore,
    wellnessStatus,
    energyLevel,
    sorenessLevel,
    sleepHours,
    lastUpdatedAt,
    activeInjury: activeInjury ?? null,
  };
}
