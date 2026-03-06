import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { acceptInvitation, validateInvitation } from "../api/admin.api";

type InviteInfo = {
  email: string;
  clubId: string;
  clubName: string;
  primary: "PLAYER" | "ADMIN" | "MANAGER";
  subRoles: string[];
  expiresAt: string;
};

export default function AcceptInvitation() {
  const [sp] = useSearchParams();
  const tokenFromQuery = sp.get("token") || "";

  const [token, setToken] = useState(tokenFromQuery);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!token.trim()) {
        setInfo(null);
        return;
      }

      try {
        setValidating(true);
        setMsg(null);
        const res = await validateInvitation(token.trim());
        if (!alive) return;
        setInfo(res.invitation as InviteInfo);
      } catch (e: any) {
        if (!alive) return;
        setInfo(null);
        setMsg({
          type: "err",
          text: e?.response?.data?.message || e?.message || "Invitation is invalid or expired.",
        });
      } finally {
        if (alive) setValidating(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [token]);

  const canSubmit = useMemo(() => {
    return (
      token.trim().length > 8 &&
      fullName.trim().length >= 2 &&
      password.length >= 6 &&
      confirmPassword === password
    );
  }, [token, fullName, password, confirmPassword]);

  const onAccept = async () => {
    setMsg(null);
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      await acceptInvitation({
        token: token.trim(),
        fullName: fullName.trim(),
        password: password.trim(),
      });
      setAccepted(true);
      setMsg({ type: "ok", text: "Invitation accepted. You can now login." });
    } catch (e: any) {
      setMsg({
        type: "err",
        text: e?.response?.data?.message || e?.message || "Failed to accept invitation.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] p-4 sm:p-6">
      <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-black/15 bg-white/75 p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-[rgb(var(--text))]">Accept Club Invitation</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Join a club using the invitation link or token from your admin.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text))]">Invitation Token</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token here"
              className="w-full rounded-xl border border-black/15 bg-white/85 px-3 py-2 text-sm outline-none"
            />
          </div>

          {validating && (
            <div className="rounded-xl border border-black/15 bg-white/70 px-3 py-2 text-sm">Validating token...</div>
          )}

          {info && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              <div className="font-semibold">Invitation is valid</div>
              <div className="mt-1">Email: {info.email}</div>
              <div>Club: {info.clubName}</div>
              <div>Role: {info.primary}</div>
              <div>Expires: {new Date(info.expiresAt).toLocaleString()}</div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text))]">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-black/15 bg-white/85 px-3 py-2 text-sm outline-none"
              disabled={accepted}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text))]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-black/15 bg-white/85 px-3 py-2 text-sm outline-none"
              disabled={accepted}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text))]">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full rounded-xl border border-black/15 bg-white/85 px-3 py-2 text-sm outline-none"
              disabled={accepted}
            />
          </div>

          {msg && (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                msg.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={onAccept}
              disabled={!canSubmit || loading || accepted}
              className="rounded-xl px-4 py-2 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-2))",
                border: "1px solid rgba(0,0,0,.15)",
              }}
            >
              {loading ? "Accepting..." : "Accept Invitation"}
            </button>

            <Link
              to="/login"
              className="rounded-xl border border-black/15 bg-white/80 px-4 py-2 text-sm font-semibold hover:bg-white"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
