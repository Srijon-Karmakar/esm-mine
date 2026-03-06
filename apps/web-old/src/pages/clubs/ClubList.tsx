import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";

type Club = { id: string; name: string; slug: string };

export default function ClubList() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Club[]>("/clubs");
        setClubs(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Clubs</h2>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-white/60">Loading...</p>
      ) : clubs.length ? (
        <div className="mt-4 grid gap-3">
          {clubs.map((c) => (
            <Link
              key={c.id}
              to={`/clubs/${c.id}`}
              className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-white/50">{c.slug}</div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">No clubs found.</p>
      )}
    </div>
  );
}
