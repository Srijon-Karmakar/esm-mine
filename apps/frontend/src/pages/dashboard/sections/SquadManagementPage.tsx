import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getClubMatches,
  getMatchLineupWorkspace,
  saveHomeMatchLineup,
  updateClubMatchSquad,
  type MatchItem,
  type MatchLineupWorkspacePlayer,
} from '../../../api/admin.api';
import { type RolePermission } from '../../../utils/rolePolicy';
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from '../../admin/admin-ui';

type Ctx = {
  clubId: string;
  permissions?: RolePermission[];
};

type EditableLineupPlayer = {
  userId: string;
  jerseyNo: string;
  position: string;
};

const HEALTH_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'default'> = {
  FIT: 'ok',
  CAUTION: 'warn',
  UNAVAILABLE: 'danger',
  NO_DATA: 'default',
};

function messageOf(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

function toEditablePlayer(player: {
  userId: string;
  jerseyNo?: number | null;
  position?: string | null;
}): EditableLineupPlayer {
  return {
    userId: player.userId,
    jerseyNo: typeof player.jerseyNo === 'number' ? String(player.jerseyNo) : '',
    position: player.position || '',
  };
}

function toPayloadPlayer(player: EditableLineupPlayer) {
  const jerseyNo = player.jerseyNo ? Number(player.jerseyNo) : undefined;
  return {
    userId: player.userId,
    jerseyNo: Number.isFinite(jerseyNo as number) ? jerseyNo : undefined,
    position: player.position.trim() || undefined,
  };
}

export default function SquadManagementPage() {
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = String(ctx.clubId || '').trim();
  const permissionSet = useMemo(() => new Set<RolePermission>(ctx.permissions || []), [ctx.permissions]);
  const canRead = permissionSet.has('lineups.read');
  const canManage = permissionSet.has('lineups.write');
  const location = useLocation();
  const requestedMatchId = String((location.state as { matchId?: string } | null)?.matchId || '').trim();

  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [assignedSquadId, setAssignedSquadId] = useState('');
  const [formation, setFormation] = useState('');
  const [captainUserId, setCaptainUserId] = useState('');
  const [starting, setStarting] = useState<EditableLineupPlayer[]>([]);
  const [bench, setBench] = useState<EditableLineupPlayer[]>([]);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const matchesQuery = useQuery({
    queryKey: ['club-matches', clubId],
    queryFn: () => getClubMatches(clubId),
    enabled: !!clubId && canRead,
  });

  const workspaceQuery = useQuery({
    queryKey: ['match-lineup-workspace', clubId, selectedMatchId],
    queryFn: () => getMatchLineupWorkspace(clubId, selectedMatchId),
    enabled: !!clubId && !!selectedMatchId && canRead,
  });

  useEffect(() => {
    if (!matchesQuery.data?.length) {
      setSelectedMatchId('');
      return;
    }

    const availableMatches = matchesQuery.data;
    if (requestedMatchId && availableMatches.some((match) => match.id === requestedMatchId)) {
      setSelectedMatchId((current) => current || requestedMatchId);
      return;
    }

    setSelectedMatchId((current) => {
      if (current && availableMatches.some((match) => match.id === current)) return current;
      const upcoming = availableMatches
        .filter((match) => new Date(match.kickoffAt || 0).getTime() >= Date.now())
        .sort((a, b) => new Date(a.kickoffAt || 0).getTime() - new Date(b.kickoffAt || 0).getTime())[0];
      return upcoming?.id || availableMatches[0]?.id || '';
    });
  }, [matchesQuery.data, requestedMatchId]);

  useEffect(() => {
    const workspace = workspaceQuery.data;
    if (!workspace) return;

    setAssignedSquadId(String(workspace.match.squadId || ''));
    setFormation(workspace.lineup.formation || '');
    setCaptainUserId(workspace.lineup.captainUserId || '');
    setStarting(workspace.lineup.starting.map(toEditablePlayer));
    setBench(workspace.lineup.bench.map(toEditablePlayer));
  }, [workspaceQuery.data]);

  const updateSquadMutation = useMutation({
    mutationFn: (squadId: string) => updateClubMatchSquad(clubId, selectedMatchId, { squadId: squadId || null }),
    onSuccess: async () => {
      setToast({ type: 'ok', msg: 'Match squad updated. The home lineup has been reset for the new roster.' });
      await Promise.all([matchesQuery.refetch(), workspaceQuery.refetch()]);
    },
    onError: (error: unknown) => {
      setToast({ type: 'err', msg: messageOf(error, 'Failed to update the match squad.') });
    },
  });

  const saveLineupMutation = useMutation({
    mutationFn: () =>
      saveHomeMatchLineup(clubId, selectedMatchId, {
        formation: formation.trim() || undefined,
        captainUserId: captainUserId || starting[0]?.userId || undefined,
        starting: starting.map(toPayloadPlayer),
        bench: bench.map(toPayloadPlayer),
      }),
    onSuccess: async () => {
      setToast({ type: 'ok', msg: 'Lineup saved successfully.' });
      await workspaceQuery.refetch();
    },
    onError: (error: unknown) => {
      setToast({ type: 'err', msg: messageOf(error, 'Failed to save the lineup.') });
    },
  });

  const roster = workspaceQuery.data?.roster || [];
  const rosterByUserId = useMemo(
    () => new Map(roster.map((player) => [player.userId, player])),
    [roster]
  );
  const selectedPlayers = useMemo(
    () => [...starting, ...bench].map((player) => rosterByUserId.get(player.userId)).filter(Boolean) as MatchLineupWorkspacePlayer[],
    [bench, rosterByUserId, starting]
  );
  const lineupLockedBySquadChange = assignedSquadId !== String(workspaceQuery.data?.match.squadId || '');

  const counters = useMemo(() => {
    const matches = matchesQuery.data || [];
    return {
      matches: matches.length,
      upcoming: matches.filter((match) => new Date(match.kickoffAt || 0).getTime() >= Date.now()).length,
      starters: starting.length,
      bench: bench.length,
    };
  }, [bench.length, matchesQuery.data, starting.length]);

  const addOrMovePlayer = (player: MatchLineupWorkspacePlayer, slot: 'STARTING' | 'BENCH') => {
    if (lineupLockedBySquadChange) {
      setToast({ type: 'err', msg: 'Save the squad assignment first so the roster refreshes.' });
      return;
    }
    if (slot === 'STARTING' && !starting.some((item) => item.userId === player.userId) && starting.length >= 11) {
      setToast({ type: 'err', msg: 'Starting lineup cannot exceed 11 players.' });
      return;
    }

    const existingPlayer =
      starting.find((item) => item.userId === player.userId) ||
      bench.find((item) => item.userId === player.userId);
    const nextPlayer = existingPlayer || {
      userId: player.userId,
      jerseyNo: typeof player.jerseyNo === 'number' ? String(player.jerseyNo) : '',
      position: player.position || '',
    };

    setStarting((current) => {
      const withoutPlayer = current.filter((item) => item.userId !== player.userId);
      if (slot === 'STARTING') return [...withoutPlayer, nextPlayer];
      return withoutPlayer;
    });
    setBench((current) => {
      const withoutPlayer = current.filter((item) => item.userId !== player.userId);
      if (slot === 'BENCH') return [...withoutPlayer, nextPlayer];
      return withoutPlayer;
    });
  };

  const removePlayer = (userId: string) => {
    setStarting((current) => current.filter((item) => item.userId !== userId));
    setBench((current) => current.filter((item) => item.userId !== userId));
    if (captainUserId === userId) {
      setCaptainUserId('');
    }
  };

  const updatePlayerField = (
    setter: Dispatch<SetStateAction<EditableLineupPlayer[]>>,
    userId: string,
    field: 'jerseyNo' | 'position',
    value: string
  ) => {
    setter((current) =>
      current.map((player) =>
        player.userId === userId ? { ...player, [field]: field === 'jerseyNo' ? value.replace(/[^\d]/g, '') : value } : player
      )
    );
  };

  const saveLineup = () => {
    if (!selectedMatchId) {
      setToast({ type: 'err', msg: 'Select a match first.' });
      return;
    }
    if (!assignedSquadId) {
      setToast({ type: 'err', msg: 'Assign a squad to the match before saving the lineup.' });
      return;
    }
    if (lineupLockedBySquadChange) {
      setToast({ type: 'err', msg: 'Save the new squad assignment before editing the lineup.' });
      return;
    }
    if (!starting.length) {
      setToast({ type: 'err', msg: 'Pick at least one starter.' });
      return;
    }

    saveLineupMutation.mutate();
  };

  if (!clubId || !canRead) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder }}
        >
          You do not have access to squad management for this club.
        </div>
      </PageWrap>
    );
  }

  if (matchesQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading squad management workspace...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Squad Management"
        subtitle="Build the matchday lineup with live health check-ins and injury context."
        right={<DotTag tone={canManage ? 'warn' : 'default'}>{canManage ? 'CAN MANAGE' : 'VIEW ONLY'}</DotTag>}
      />

      {toast ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: adminCardBorder, background: 'rgba(255,255,255,.65)' }}
        >
          <span className={toast.type === 'ok' ? 'text-emerald-700' : 'text-rose-700'}>{toast.msg}</span>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Matches" value={counters.matches} />
        <Stat label="Upcoming" value={counters.upcoming} />
        <Stat label="Starters" value={counters.starters} />
        <Stat label="Bench" value={counters.bench} />
        <Stat label="Fit" value={workspaceQuery.data?.availability.fit || 0} />
        <Stat label="Unavailable" value={workspaceQuery.data?.availability.unavailable || 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Match Selector"
          subtitle="Choose the fixture you want to prepare."
          className="xl:col-span-5"
        >
          <div className="grid gap-3">
            <select
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
              className="rounded-xl border bg-white/85 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            >
              {!matchesQuery.data?.length ? <option value="">No matches available</option> : null}
              {(matchesQuery.data || []).map((match: MatchItem) => (
                <option key={match.id} value={match.id}>
                  {(match.title || match.opponent || 'Match').trim()} - {formatDateTime(match.kickoffAt)}
                </option>
              ))}
            </select>

            {workspaceQuery.data?.match ? (
              <div className="rounded-2xl border bg-white/75 px-4 py-3" style={{ borderColor: adminCardBorder }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-[rgb(var(--text))]">
                      {workspaceQuery.data.match.title || `vs ${workspaceQuery.data.match.opponent || 'Opponent'}`}
                    </p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {formatDateTime(workspaceQuery.data.match.kickoffAt)} | {workspaceQuery.data.match.venue || 'Venue TBA'}
                    </p>
                  </div>
                  <DotTag tone={String(workspaceQuery.data.match.status || '') === 'LIVE' ? 'warn' : 'default'}>
                    {workspaceQuery.data.match.status || 'SCHEDULED'}
                  </DotTag>
                </div>
              </div>
            ) : null}
          </div>
        </Section>

        <Section
          title="Squad Assignment"
          subtitle="Bind the fixture to the correct squad before selecting the lineup."
          className="xl:col-span-7"
          dark
        >
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-2">
              <label className="text-xs text-white/70">Assigned squad</label>
              <select
                value={assignedSquadId}
                onChange={(event) => setAssignedSquadId(event.target.value)}
                disabled={!canManage || !selectedMatchId}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none disabled:opacity-60"
              >
                <option value="">No squad assigned</option>
                {(workspaceQuery.data?.availableSquads || []).map((squad) => (
                  <option key={squad.id} value={squad.id}>
                    {squad.name} ({squad._count?.members ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => updateSquadMutation.mutate(assignedSquadId)}
              disabled={!canManage || !selectedMatchId || updateSquadMutation.isPending || !workspaceQuery.data}
              className="rounded-xl border border-white/15 bg-white px-4 py-2 text-sm font-bold text-[rgb(var(--text))] disabled:opacity-60"
            >
              {updateSquadMutation.isPending ? 'Saving...' : 'Save squad'}
            </button>
          </div>
          <p className="mt-3 text-xs text-white/65">
            Changing the assigned squad resets the current home lineup so the roster stays valid.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <Stat label="Fit" value={workspaceQuery.data?.availability.fit || 0} />
            <Stat label="Review" value={workspaceQuery.data?.availability.caution || 0} />
            <Stat label="Unavailable" value={workspaceQuery.data?.availability.unavailable || 0} />
            <Stat label="No Check-In" value={workspaceQuery.data?.availability.noData || 0} />
          </div>
        </Section>
      </div>

      <Section
        title="Lineup Builder"
        subtitle="Select starters and bench players. Health status is pulled from each player's latest check-in and active injury record."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={formation}
              onChange={(event) => setFormation(event.target.value)}
              disabled={!canManage || lineupLockedBySquadChange}
              placeholder="Formation e.g. 4-3-3"
              className="rounded-full border bg-white/85 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <select
              value={captainUserId}
              onChange={(event) => setCaptainUserId(event.target.value)}
              disabled={!canManage || lineupLockedBySquadChange || !selectedPlayers.length}
              className="rounded-full border bg-white/85 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            >
              <option value="">Captain</option>
              {selectedPlayers.map((player) => (
                <option key={player.userId} value={player.userId}>
                  {player.user.fullName || player.user.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={saveLineup}
              disabled={!canManage || saveLineupMutation.isPending || !selectedMatchId}
              className="rounded-full border bg-[rgb(var(--primary))] px-4 py-2 text-xs font-extrabold text-[rgb(var(--primary-2))] disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            >
              {saveLineupMutation.isPending ? 'Saving lineup...' : 'Save lineup'}
            </button>
          </div>
        }
      >
        {!selectedMatchId ? (
          <p className="text-sm text-[rgb(var(--muted))]">Select a match to start building the lineup.</p>
        ) : workspaceQuery.isLoading ? (
          <p className="text-sm text-[rgb(var(--muted))]">Loading lineup workspace...</p>
        ) : !assignedSquadId ? (
          <p className="text-sm text-[rgb(var(--muted))]">Assign a squad to this match to unlock the player roster.</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-12">
            <div className="xl:col-span-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Available Players</p>
              {!roster.length ? (
                <p className="text-sm text-[rgb(var(--muted))]">No players in the assigned squad yet.</p>
              ) : (
                roster.map((player) => {
                  const isStarter = starting.some((item) => item.userId === player.userId);
                  const isBench = bench.some((item) => item.userId === player.userId);
                  return (
                    <article
                      key={player.userId}
                      className="rounded-2xl border bg-white/75 px-3 py-3"
                      style={{ borderColor: adminCardBorder }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">
                            {player.user.fullName || player.user.email}
                          </p>
                          <p className="truncate text-xs text-[rgb(var(--muted))]">
                            Jersey {player.jerseyNo ?? '-'} | {player.position || player.profile?.positions?.join(', ') || 'No position'}
                          </p>
                        </div>
                        <DotTag tone={HEALTH_TONE[player.health.status] || 'default'}>{player.health.label}</DotTag>
                      </div>
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">{player.health.note}</p>
                      <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                        Readiness {player.health.readinessScore ?? '-'} | Energy {player.health.energyLevel ?? '-'} | Soreness {player.health.sorenessLevel ?? '-'} | Sleep {player.health.sleepHours ?? '-'}
                      </p>
                      <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                        Last check-in: {formatDateTime(player.health.lastUpdatedAt)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => addOrMovePlayer(player, 'STARTING')}
                          disabled={!canManage || lineupLockedBySquadChange || (starting.length >= 11 && !isStarter)}
                          className="rounded-full border bg-white px-3 py-1 text-[11px] font-semibold disabled:opacity-60"
                          style={{ borderColor: adminCardBorder }}
                        >
                          {isStarter ? 'In starters' : 'Add to starters'}
                        </button>
                        <button
                          type="button"
                          onClick={() => addOrMovePlayer(player, 'BENCH')}
                          disabled={!canManage || lineupLockedBySquadChange}
                          className="rounded-full border bg-white px-3 py-1 text-[11px] font-semibold disabled:opacity-60"
                          style={{ borderColor: adminCardBorder }}
                        >
                          {isBench ? 'On bench' : 'Add to bench'}
                        </button>
                        {(isStarter || isBench) ? (
                          <button
                            type="button"
                            onClick={() => removePlayer(player.userId)}
                            disabled={!canManage || lineupLockedBySquadChange}
                            className="rounded-full border bg-white px-3 py-1 text-[11px] font-semibold text-rose-700 disabled:opacity-60"
                            style={{ borderColor: adminCardBorder }}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="xl:col-span-7 grid gap-4 lg:grid-cols-2">
              <LineupColumn
                title="Starting XI"
                subtitle="Maximum 11 players"
                players={starting}
                rosterByUserId={rosterByUserId}
                onRemove={removePlayer}
                onUpdateField={(userId, field, value) => updatePlayerField(setStarting, userId, field, value)}
                disabled={!canManage || lineupLockedBySquadChange}
              />
              <LineupColumn
                title="Bench"
                subtitle="Selected substitutes"
                players={bench}
                rosterByUserId={rosterByUserId}
                onRemove={removePlayer}
                onUpdateField={(userId, field, value) => updatePlayerField(setBench, userId, field, value)}
                disabled={!canManage || lineupLockedBySquadChange}
              />
            </div>
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

type LineupColumnProps = {
  title: string;
  subtitle: string;
  players: EditableLineupPlayer[];
  rosterByUserId: Map<string, MatchLineupWorkspacePlayer>;
  onRemove: (userId: string) => void;
  onUpdateField: (userId: string, field: 'jerseyNo' | 'position', value: string) => void;
  disabled: boolean;
};

function LineupColumn({
  title,
  subtitle,
  players,
  rosterByUserId,
  onRemove,
  onUpdateField,
  disabled,
}: LineupColumnProps) {
  return (
    <div className="rounded-3xl border bg-white/55 p-4" style={{ borderColor: adminCardBorder }}>
      <div className="mb-3">
        <p className="text-sm font-extrabold text-[rgb(var(--text))]">{title}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{subtitle}</p>
      </div>

      {!players.length ? (
        <p className="text-sm text-[rgb(var(--muted))]">No players selected.</p>
      ) : (
        <div className="space-y-3">
          {players.map((player) => {
            const rosterPlayer = rosterByUserId.get(player.userId);
            return (
              <article
                key={player.userId}
                className="rounded-2xl border bg-white/85 px-3 py-3"
                style={{ borderColor: adminCardBorder }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[rgb(var(--text))]">
                      {rosterPlayer?.user.fullName || rosterPlayer?.user.email || player.userId}
                    </p>
                    <p className="text-xs text-[rgb(var(--muted))]">{rosterPlayer?.health.label || 'No status'} | {rosterPlayer?.health.note || 'No health details yet'}</p>
                  </div>
                  <DotTag tone={HEALTH_TONE[rosterPlayer?.health.status || 'NO_DATA'] || 'default'}>
                    {rosterPlayer?.health.label || 'Check-in needed'}
                  </DotTag>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    value={player.jerseyNo}
                    onChange={(event) => onUpdateField(player.userId, 'jerseyNo', event.target.value)}
                    disabled={disabled}
                    placeholder="Jersey"
                    className="rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
                    style={{ borderColor: adminCardBorder }}
                  />
                  <input
                    value={player.position}
                    onChange={(event) => onUpdateField(player.userId, 'position', event.target.value)}
                    disabled={disabled}
                    placeholder="Position"
                    className="rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
                    style={{ borderColor: adminCardBorder }}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemove(player.userId)}
                    disabled={disabled}
                    className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
                    style={{ borderColor: adminCardBorder }}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
