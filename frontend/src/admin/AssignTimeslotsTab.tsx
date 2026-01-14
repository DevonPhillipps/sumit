import { useMemo } from "react";

export type DayOfWeekKey =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

export type VenueDTO = { id: number; name: string };

export type TimeslotDTO = {
    id: number;
    startTime: string;
    endTime: string;
    turnaroundMinutes: number;
};

export type VenueTimeslotDTO = {
    id: number;
    venueId: number;
    timeslotId: number;
    day: DayOfWeekKey;
};

type Props = {
    setSchedulingTab: (tab: "venues" | "timeslots" | "assign") => void;

    // data
    venues: VenueDTO[];
    venuesLoading: boolean;
    timeslots: TimeslotDTO[];
    timeslotsLoading: boolean;

    // selection + draft
    assignVenueId: number;
    setAssignVenueId: (id: number) => void;

    selectedTimeslotIds: Record<number, boolean>;
    setSelectedTimeslotIds: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;

    venueTimeslots: VenueTimeslotDTO[];
    setVenueTimeslots: React.Dispatch<React.SetStateAction<VenueTimeslotDTO[]>>;

    // helpers
    dayOptions: DayOfWeekKey[];
    niceDayLabel: (d: DayOfWeekKey) => string;
    normalizeTimeToHHMM: (t: string) => string;
    compareHHMM: (a: string, b: string) => number;

    // backend save
    saveScheduleToBackend: () => void;
    saveScheduleLoading: boolean;
    saveScheduleError: string | null;
    saveScheduleSuccess: string | null;

    // UI errors
    assignError: string | null;
    setAssignError: (v: string | null) => void;

    // endpoints text (optional)
    VENUE_TIMESLOTS_CREATE: string;
};

export default function AssignTimeslotsTab({
                                               setSchedulingTab,

                                               venues,
                                               venuesLoading,
                                               timeslots,
                                               timeslotsLoading,

                                               assignVenueId,
                                               setAssignVenueId,

                                               selectedTimeslotIds,
                                               setSelectedTimeslotIds,

                                               venueTimeslots,
                                               setVenueTimeslots,

                                               dayOptions,
                                               niceDayLabel,
                                               normalizeTimeToHHMM,
                                               compareHHMM,

                                               saveScheduleToBackend,
                                               saveScheduleLoading,
                                               saveScheduleError,
                                               saveScheduleSuccess,

                                               assignError,
                                               setAssignError,

                                               VENUE_TIMESLOTS_CREATE,
                                           }: Props) {
    const selectedIds = useMemo(
        () => Object.keys(selectedTimeslotIds).filter((k) => selectedTimeslotIds[+k]).map(Number),
        [selectedTimeslotIds]
    );

    const getTimeslotLabel = (id: number) => {
        const t = timeslots.find((x) => x.id === id);
        if (!t) return `Timeslot #${id}`;
        const s = normalizeTimeToHHMM(t.startTime);
        const e = normalizeTimeToHHMM(t.endTime);
        return `${s}–${e} (+${t.turnaroundMinutes}m)`;
    };

    const toggleSelected = (timeslotId: number) => {
        setSelectedTimeslotIds((prev) => ({ ...prev, [timeslotId]: !prev[timeslotId] }));
    };

    const addTimeslotsToDayLocal = (day: DayOfWeekKey, timeslotIds: number[]) => {
        setAssignError(null);

        if (!assignVenueId) return setAssignError("Pick a venue first.");
        if (!timeslotIds.length) return setAssignError("Select at least one timeslot.");

        setVenueTimeslots((prev) => {
            let next = prev.slice();
            let nextId = (next.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;

            for (const tid of timeslotIds) {
                const exists = next.some((x) => x.venueId === assignVenueId && x.day === day && x.timeslotId === tid);
                if (exists) continue;
                next.push({ id: nextId++, venueId: assignVenueId, day, timeslotId: tid });
            }
            return next;
        });
    };

    const removeAssignmentLocal = (assignmentId: number) => {
        setVenueTimeslots((prev) => prev.filter((x) => x.id !== assignmentId));
    };

    const applySelectedToAllDays = () => {
        if (!selectedIds.length) return setAssignError("Select timeslots first.");
        for (const d of dayOptions) addTimeslotsToDayLocal(d, selectedIds);
    };

    const assignmentsForVenue = useMemo(
        () => venueTimeslots.filter((x) => x.venueId === assignVenueId),
        [venueTimeslots, assignVenueId]
    );

    const assignmentsByDay = useMemo(() => {
        const map: Record<DayOfWeekKey, VenueTimeslotDTO[]> = {
            MONDAY: [],
            TUESDAY: [],
            WEDNESDAY: [],
            THURSDAY: [],
            FRIDAY: [],
            SATURDAY: [],
            SUNDAY: [],
        };

        for (const a of assignmentsForVenue) map[a.day].push(a);

        for (const d of dayOptions) {
            map[d] = map[d]
                .slice()
                .sort((x, y) => getTimeslotLabel(x.timeslotId).localeCompare(getTimeslotLabel(y.timeslotId)));
        }

        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentsForVenue, timeslots]);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                        Assign timeslots to a venue (per day, with apply-to-all)
                    </div>

                    <button
                        className={`text-xs px-4 py-2 rounded-full font-semibold transition ${
                            saveScheduleLoading
                                ? "bg-emerald-500/40 text-black/60 cursor-not-allowed"
                                : "bg-emerald-500/90 hover:bg-emerald-400 text-black"
                        }`}
                        onClick={saveScheduleToBackend}
                        disabled={saveScheduleLoading || !assignVenueId}
                        title="Posts VenueTimeslotsDTO to backend"
                    >
                        {saveScheduleLoading ? "Saving…" : "Save schedule to backend"}
                    </button>
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                    POSTing to <span className="text-slate-400">{VENUE_TIMESLOTS_CREATE}</span>
                </div>

                {saveScheduleError && (
                    <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {saveScheduleError}
                    </div>
                )}
                {saveScheduleSuccess && (
                    <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        {saveScheduleSuccess}
                    </div>
                )}

                <div className="mt-4">
                    {venuesLoading ? (
                        <div className="text-sm text-slate-400">Loading venues…</div>
                    ) : venues.length === 0 ? (
                        <div className="text-sm text-slate-400">
                            No venues loaded. Create one in the Venues tab, then come back.
                        </div>
                    ) : timeslotsLoading ? (
                        <div className="text-sm text-slate-400">Loading timeslots…</div>
                    ) : timeslots.length === 0 ? (
                        <div className="text-sm text-slate-400">
                            No timeslots loaded. Create one in the Timeslots tab, then come back.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-1">
                                <label className="block text-xs text-slate-400 mb-1">Venue</label>
                                <select
                                    value={assignVenueId}
                                    onChange={(e) => {
                                        setAssignVenueId(parseInt(e.target.value, 10));
                                        setAssignError(null);
                                    }}
                                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                                >
                                    {venues.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} (#{v.id})
                                        </option>
                                    ))}
                                </select>

                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        className="text-xs px-4 py-2 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                        onClick={() => setSchedulingTab("venues")}
                                    >
                                        Back to venues →
                                    </button>
                                    <button
                                        className="text-xs px-4 py-2 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                        onClick={() => setSchedulingTab("timeslots")}
                                    >
                                        Timeslots →
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs uppercase tracking-wide text-slate-500">Pick timeslots</div>
                                    <button
                                        className="text-xs px-3 py-1 rounded-full bg-sky-500/90 hover:bg-sky-400 text-black font-semibold transition"
                                        onClick={applySelectedToAllDays}
                                        disabled={!selectedIds.length || !assignVenueId}
                                    >
                                        Apply selected to all days
                                    </button>
                                </div>

                                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {timeslots
                                        .slice()
                                        .sort((a, b) =>
                                            compareHHMM(normalizeTimeToHHMM(a.startTime), normalizeTimeToHHMM(b.startTime))
                                        )
                                        .map((t) => {
                                            const checked = !!selectedTimeslotIds[t.id];
                                            return (
                                                <label
                                                    key={t.id}
                                                    className={`rounded-2xl border px-3 py-2 text-sm cursor-pointer transition ${
                                                        checked
                                                            ? "border-sky-500/70 bg-sky-500/10"
                                                            : "border-slate-800 bg-slate-900/40 hover:border-sky-500/50"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1"
                                                            checked={checked}
                                                            onChange={() => toggleSelected(t.id)}
                                                        />
                                                        <div>
                                                            <div className="text-slate-100 font-medium">
                                                                {normalizeTimeToHHMM(t.startTime)}–{normalizeTimeToHHMM(t.endTime)}
                                                            </div>
                                                            <div className="text-xs text-slate-500">+{t.turnaroundMinutes}m</div>
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                </div>

                                {assignError && (
                                    <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                        {assignError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">Schedule by day</div>

                {!assignVenueId || venues.length === 0 ? (
                    <div className="text-sm text-slate-400">Select a venue first.</div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {dayOptions.map((day) => {
                            const dayAssignments = assignmentsByDay[day];

                            return (
                                <div key={day} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold">{niceDayLabel(day)}</div>

                                        <button
                                            className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                                            onClick={() => addTimeslotsToDayLocal(day, selectedIds)}
                                            disabled={!selectedIds.length}
                                        >
                                            + Add selected
                                        </button>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {dayAssignments.length === 0 ? (
                                            <div className="text-xs text-slate-500">No timeslots yet.</div>
                                        ) : (
                                            dayAssignments.map((a) => (
                                                <div
                                                    key={a.id}
                                                    className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/40 px-3 py-1"
                                                >
                                                    <span className="text-xs text-slate-200">{getTimeslotLabel(a.timeslotId)}</span>
                                                    <button
                                                        className="text-xs text-red-300 hover:text-red-200 transition"
                                                        onClick={() => removeAssignmentLocal(a.id)}
                                                        title="Remove"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <select
                                            className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                                            defaultValue=""
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (!val) return;
                                                addTimeslotsToDayLocal(day, [parseInt(val, 10)]);
                                                e.currentTarget.value = "";
                                            }}
                                        >
                                            <option value="">+ Add single timeslot…</option>
                                            {timeslots
                                                .slice()
                                                .sort((a, b) =>
                                                    compareHHMM(normalizeTimeToHHMM(a.startTime), normalizeTimeToHHMM(b.startTime))
                                                )
                                                .map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {normalizeTimeToHHMM(t.startTime)}–{normalizeTimeToHHMM(t.endTime)} (+{t.turnaroundMinutes}m)
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-3 text-[11px] text-slate-500">
                    Draft is local, but <span className="text-slate-400">Save schedule to backend</span> posts the full week using your DTO.
                </div>
            </div>
        </div>
    );
}
