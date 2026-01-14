export type TownDTO = { id: number; name: string };

export type VenueDTO = {
    id: number;
    name: string;
    maxCapacity: number;
    streetAddress: string;
    url: string;
    town: string;
};

type Props = {
    // tab nav
    setSchedulingTab: (tab: "venues" | "timeslots" | "assign") => void;

    // towns
    towns: TownDTO[];
    townsLoading: boolean;
    townsError: string | null;
    fetchTowns: () => void;

    // venues
    venues: VenueDTO[];
    venuesLoading: boolean;
    venuesError: string | null;

    // form state
    venueName: string;
    setVenueName: (v: string) => void;
    venueMaxCapacity: string;
    setVenueMaxCapacity: (v: string) => void;

    streetAddress: string;
    setStreetAddress: (v: string) => void;
    streetTownId: number;
    setStreetTownId: (v: number) => void;

    mapsLink: string;
    setMapsLink: (v: string) => void;

    streetLat: string;
    setStreetLat: (v: string) => void;
    streetLng: string;
    setStreetLng: (v: string) => void;

    venueFormError: string | null;
    venueFormLoading: boolean;

    // actions
    createVenue: () => void;
    deleteVenueLocal: (id: number) => void;

    // small helpers
    venuesCount: number;
};

export default function VenuesTab({
                                      setSchedulingTab,

                                      towns,
                                      townsLoading,
                                      townsError,
                                      fetchTowns,

                                      venues,
                                      venuesLoading,
                                      venuesError,

                                      venueName,
                                      setVenueName,
                                      venueMaxCapacity,
                                      setVenueMaxCapacity,

                                      streetAddress,
                                      setStreetAddress,
                                      streetTownId,
                                      setStreetTownId,

                                      mapsLink,
                                      setMapsLink,

                                      streetLat,
                                      setStreetLat,
                                      streetLng,
                                      setStreetLng,

                                      venueFormError,
                                      venueFormLoading,

                                      createVenue,
                                      deleteVenueLocal,

                                      venuesCount,
                                  }: Props) {
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                        Create venue
                    </div>
                    <button
                        className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                        onClick={fetchTowns}
                        disabled={townsLoading}
                    >
                        {townsLoading ? "Loading…" : "Refresh towns"}
                    </button>
                </div>

                {townsError && (
                    <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {townsError}
                    </div>
                )}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Venue name</label>
                        <input
                            value={venueName}
                            onChange={(e) => setVenueName(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                            placeholder="e.g. Durbanville Library Room A"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Max capacity</label>
                        <input
                            value={venueMaxCapacity}
                            onChange={(e) => setVenueMaxCapacity(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                            placeholder="e.g. 20"
                            inputMode="numeric"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 mb-1">Street address</label>
                        <input
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                            placeholder="e.g. 12 Example Street, Suburb"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Town</label>
                        <select
                            value={streetTownId}
                            onChange={(e) => setStreetTownId(parseInt(e.target.value, 10))}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40 capitalize"
                        >
                            {towns.length === 0 ? (
                                <option value={0}>No towns loaded</option>
                            ) : (
                                towns.map((t) => (
                                    <option key={t.id} value={t.id} className="capitalize">
                                        {t.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Maps link / url</label>
                        <input
                            value={mapsLink}
                            onChange={(e) => setMapsLink(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                            placeholder="e.g. https://maps.google.com/?q=..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Latitude (optional)</label>
                        <input
                            value={streetLat}
                            onChange={(e) => setStreetLat(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                            placeholder="-33.123456"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Longitude (optional)</label>
                        <input
                            value={streetLng}
                            onChange={(e) => setStreetLng(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                            placeholder="18.123456"
                        />
                    </div>
                </div>

                {venueFormError && (
                    <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {venueFormError}
                    </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                    <button
                        className={`text-xs px-4 py-2 rounded-full font-semibold transition ${
                            venueFormLoading
                                ? "bg-emerald-500/40 text-black/60 cursor-not-allowed"
                                : "bg-emerald-500/90 hover:bg-emerald-400 text-black"
                        }`}
                        onClick={createVenue}
                        disabled={venueFormLoading || towns.length === 0}
                    >
                        {venueFormLoading ? "Creating…" : "+ Create venue"}
                    </button>

                    {/* ✅ Assign lives inside Venues tab */}
                    <button
                        className="text-xs px-4 py-2 rounded-full border border-slate-700 hover:border-sky-500 text-slate-200 transition"
                        onClick={() => setSchedulingTab("assign")}
                        disabled={venues.length === 0 && venuesLoading}
                    >
                        Go to assign →
                    </button>
                </div>
            </div>

            {venuesError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {venuesError}
                </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
                    Existing venues
                </div>

                {venuesLoading ? (
                    <div className="text-sm text-slate-400">Loading venues…</div>
                ) : venues.length === 0 ? (
                    <div className="text-sm text-slate-400">No venues yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-800">
                                <th className="py-2 pr-4">Venue</th>
                                <th className="py-2 pr-4">Address</th>
                                <th className="py-2 pr-4">Town</th>
                                <th className="py-2 pr-4">Maps</th>
                                <th className="py-2 pr-4">Capacity</th>
                                <th className="py-2 pr-4 text-right">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {venues.map((v) => (
                                <tr key={v.id} className="border-b border-slate-800/60 last:border-0">
                                    <td className="py-2 pr-4 text-slate-100">
                                        <div className="font-medium">{v.name}</div>
                                        <div className="text-xs text-slate-500">#{v.id}</div>
                                    </td>
                                    <td className="py-2 pr-4 text-slate-300">{v.streetAddress || "—"}</td>
                                    <td className="py-2 pr-4 text-slate-300 capitalize">{v.town || "—"}</td>
                                    <td className="py-2 pr-4 text-slate-300">
                                        {v.url ? (
                                            <a
                                                href={v.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sky-400 hover:text-sky-300 transition"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Open
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="py-2 pr-4 text-slate-300">{v.maxCapacity}</td>
                                    <td className="py-2 pr-4 text-right">
                                        <button
                                            className="text-xs px-3 py-1 rounded-full bg-red-500/80 hover:bg-red-400 text-white transition"
                                            onClick={() => deleteVenueLocal(v.id)}
                                        >
                                            Delete (local)
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className="mt-2 text-[11px] text-slate-500">
                            Total venues loaded: <span className="text-slate-400">{venuesCount}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
