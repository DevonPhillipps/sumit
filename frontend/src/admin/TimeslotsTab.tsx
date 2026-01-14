export type TimeslotDTO = {
    id: number;
    startTime: string;
    endTime: string;
    turnaroundMinutes: number;
};

type Props = {
    setSchedulingTab: (tab: "venues" | "timeslots" | "assign") => void;

    timeslots: TimeslotDTO[];
    timeslotsLoading: boolean;
    timeslotsError: string | null;

    slotStart: string;
    setSlotStart: (v: string) => void;
    slotEnd: string;
    setSlotEnd: (v: string) => void;
    slotTurnaround: string;
    setSlotTurnaround: (v: string) => void;

    slotFormError: string | null;
    slotFormLoading: boolean;

    fetchTimeslots: () => void;
    createTimeslot: () => void;
    deleteTimeslotLocal: (id: number) => void;

    normalizeTimeToHHMM: (t: string) => string;
    compareHHMM: (a: string, b: string) => number;
};

export default function TimeslotsTab({
                                         setSchedulingTab,

                                         timeslots,
                                         timeslotsLoading,
                                         timeslotsError,

                                         slotStart,
                                         setSlotStart,
                                         slotEnd,
                                         setSlotEnd,
                                         slotTurnaround,
                                         setSlotTurnaround,

                                         slotFormError,
                                         slotFormLoading,

                                         fetchTimeslots,
                                         createTimeslot,
                                         deleteTimeslotLocal,

                                         normalizeTimeToHHMM,
                                         compareHHMM,
                                     }: Props) {
    return (
        <div className="space-y-6">
            {timeslotsError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {timeslotsError}
                </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">Create timeslot</div>
                    <button
                        className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                        onClick={fetchTimeslots}
                        disabled={timeslotsLoading}
                    >
                        {timeslotsLoading ? "Loading…" : "Refresh timeslots"}
                    </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Start (HH:mm)</label>
                        <input
                            value={slotStart}
                            onChange={(e) => setSlotStart(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                            placeholder="15:30"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">End (HH:mm)</label>
                        <input
                            value={slotEnd}
                            onChange={(e) => setSlotEnd(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                            placeholder="16:45"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Turnaround (min)</label>
                        <input
                            value={slotTurnaround}
                            onChange={(e) => setSlotTurnaround(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                            placeholder="15"
                            inputMode="numeric"
                        />
                    </div>
                </div>

                {slotFormError && (
                    <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {slotFormError}
                    </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                    <button
                        className={`text-xs px-4 py-2 rounded-full font-semibold transition ${
                            slotFormLoading
                                ? "bg-emerald-500/40 text-black/60 cursor-not-allowed"
                                : "bg-emerald-500/90 hover:bg-emerald-400 text-black"
                        }`}
                        onClick={createTimeslot}
                        disabled={slotFormLoading}
                    >
                        {slotFormLoading ? "Creating…" : "+ Create timeslot"}
                    </button>

                    <button
                        className="text-xs px-4 py-2 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                        onClick={() => setSchedulingTab("venues")}
                    >
                        Back to venues →
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">Existing timeslots</div>

                {timeslotsLoading ? (
                    <div className="text-sm text-slate-400">Loading timeslots…</div>
                ) : timeslots.length === 0 ? (
                    <div className="text-sm text-slate-400">No timeslots yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-800">
                                <th className="py-2 pr-4">Timeslot</th>
                                <th className="py-2 pr-4">Turnaround</th>
                                <th className="py-2 pr-4 text-right">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {timeslots
                                .slice()
                                .sort((a, b) =>
                                    compareHHMM(normalizeTimeToHHMM(a.startTime), normalizeTimeToHHMM(b.startTime))
                                )
                                .map((t) => (
                                    <tr key={t.id} className="border-b border-slate-800/60 last:border-0">
                                        <td className="py-2 pr-4 text-slate-100">
                                            <div className="font-medium">
                                                {normalizeTimeToHHMM(t.startTime)}–{normalizeTimeToHHMM(t.endTime)}
                                            </div>
                                            <div className="text-xs text-slate-500">#{t.id}</div>
                                        </td>
                                        <td className="py-2 pr-4 text-slate-300">{t.turnaroundMinutes} min</td>
                                        <td className="py-2 pr-4 text-right">
                                            <button
                                                className="text-xs px-3 py-1 rounded-full bg-red-500/80 hover:bg-red-400 text-white transition"
                                                onClick={() => deleteTimeslotLocal(t.id)}
                                            >
                                                Delete (local)
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-2 text-[11px] text-slate-500">
                            Note: delete is still local because you haven’t added a DELETE endpoint for timeslots yet.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
