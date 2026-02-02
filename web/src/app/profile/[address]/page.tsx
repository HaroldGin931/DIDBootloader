"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { ProofCard } from "@/components/ProofCard";
import { getAttestations, type StoredAttestation } from "@/lib/attestations";
import { formatPassportId } from "@/lib/identity";
import Link from "next/link";

export default function ProfilePage() {
  const { address } = useParams<{ address: string }>();
  const [attestations, setAttestations] = useState<StoredAttestation[]>([]);
  const [passportHash, setPassportHash] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      setAttestations(getAttestations(address));
      fetch(`/api/identity?address=${encodeURIComponent(address)}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setPassportHash(d.passportHash); })
        .catch(() => {})
        .finally(() => setLoaded(true));
    }
  }, [address]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const platforms = useMemo(() => {
    const set = new Set<string>();
    for (const att of attestations) set.add(att.platform);
    return Array.from(set);
  }, [attestations]);

  const filtered = useMemo(() => {
    let list = attestations;
    if (platformFilter) list = list.filter((a) => a.platform === platformFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.value.toLowerCase().includes(q) ||
          a.platform.toLowerCase().includes(q),
      );
    }
    return list;
  }, [attestations, platformFilter, search]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[960px] px-4 py-6">
        {/* Identity header */}
        {passportHash && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border-muted bg-bg px-4 py-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--gradient-brand-from), var(--gradient-brand-to))" }}
            >
              ID
            </div>
            <span className="font-mono text-sm font-bold text-text">{formatPassportId(passportHash)}</span>
          </div>
        )}

        {/* Search & filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-border-muted bg-bg pl-8 pr-3 text-xs text-text placeholder:text-text-muted outline-none transition-colors focus:border-primary"
            />
          </div>
          <select
            value={platformFilter ?? ""}
            onChange={(e) => setPlatformFilter(e.target.value || null)}
            className="h-8 rounded-md border border-border-muted bg-bg px-2 pr-7 text-xs text-text outline-none transition-colors focus:border-primary appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239FA6AE' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            <option value="">All</option>
            {platforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Proof cards */}
        {!loaded ? null : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((att) => (
              <ProofCard key={att.id} attestation={att} shareUrl={shareUrl} />
            ))}
          </div>
        ) : attestations.length > 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No matching cards</p>
        ) : (
          <p className="py-8 text-center text-sm text-text-muted">No ZK cards yet. <Link href="/attest" className="text-primary hover:underline">Start verification</Link></p>
        )}
      </main>
    </div>
  );
}
