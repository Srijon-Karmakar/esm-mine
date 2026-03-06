import { useParams } from "react-router-dom";

export default function ClubDetails() {
  const { clubId } = useParams();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold">Club</h2>
      <p className="mt-2 text-sm text-white/60">clubId: {clubId}</p>

      <div className="mt-4 text-sm text-white/60">
        Next step: show Matches list + Create Match here.
      </div>
    </div>
  );
}
