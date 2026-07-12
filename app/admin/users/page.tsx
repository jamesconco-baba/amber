"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, inputClass } from "@/components/ui";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  onboarded: boolean;
  isAdmin: boolean;
  memories: number;
  messages: number;
  beneficiaries: number;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (p: number, query: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users?page=${p}&q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setUsers(json.users);
      setHasMore(json.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    load(0, q);
  };

  const toggleAdmin = async (u: UserRow) => {
    setBusyId(u.id);
    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, isAdmin: !u.isAdmin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isAdmin: !x.isAdmin } : x)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update admin access.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Users" subtitle="Every account, with their activity at a glance." />

      <form onSubmit={search} className="mb-4 flex max-w-sm gap-2">
        <input
          className={inputClass}
          placeholder="Search by email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" size="sm">Search</Button>
      </form>

      {error && <Card className="mb-4 p-4 text-sm text-clay">{error}</Card>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-sage">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-4 py-3 font-medium">Onboarded</th>
                <th className="px-4 py-3 font-medium">Memories</th>
                <th className="px-4 py-3 font-medium">Messages</th>
                <th className="px-4 py-3 font-medium">Circle</th>
                <th className="px-4 py-3 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink/[0.06] last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-ink">{u.name || "—"}</div>
                    <div className="text-xs text-sage">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink/80">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-ink/80">{formatDate(u.lastSignInAt)}</td>
                  <td className="px-4 py-3">
                    {u.onboarded ? (
                      <span className="rounded-full bg-sage/20 px-2.5 py-0.5 text-xs font-medium text-sage">Yes</span>
                    ) : (
                      <span className="rounded-full bg-ink/8 px-2.5 py-0.5 text-xs font-medium text-ink/50">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/80">{u.memories}</td>
                  <td className="px-4 py-3 text-ink/80">{u.messages}</td>
                  <td className="px-4 py-3 text-ink/80">{u.beneficiaries}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAdmin(u)}
                      disabled={busyId === u.id}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                        u.isAdmin ? "bg-amber-wash text-clay" : "bg-ink/8 text-ink/50 hover:bg-ink/15"
                      }`}
                    >
                      {u.isAdmin ? "Admin" : "Make admin"}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-sage">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0 || loading}
          onClick={() => {
            const p = page - 1;
            setPage(p);
            load(p, q);
          }}
        >
          Previous
        </Button>
        <span className="text-xs text-sage">Page {page + 1}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore || loading}
          onClick={() => {
            const p = page + 1;
            setPage(p);
            load(p, q);
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
