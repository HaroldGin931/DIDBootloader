"use client";

import { useState, useRef, useCallback } from "react";
import type { StoredAttestation } from "@/lib/attestations";
import { PLATFORM_STYLES } from "@/lib/templates";

interface ProofCardProps {
  attestation: StoredAttestation;
  shareUrl?: string;
}

function PlatformWatermark({ icon }: { icon: string }) {
  if (icon === "binance") {
    return (
      <svg viewBox="0 0 126 126" fill="currentColor" className="absolute -left-4 -bottom-6 h-36 w-36 opacity-[0.07]">
        <path d="M38.4 53.3l-7.7 7.7 7.7 7.7 7.7-7.7-7.7-7.7zM63 28.7l17.2 17.2 7.7-7.7L63 13.3 38.1 38.2l7.7 7.7L63 28.7zm24.6 24.6l-7.7 7.7 7.7 7.7 7.7-7.7-7.7-7.7zM63 78.3L45.8 61.1l-7.7 7.7L63 93.7l24.9-24.9-7.7-7.7L63 78.3zM63 53.3l-7.7 7.7 7.7 7.7 7.7-7.7-7.7-7.7z" />
      </svg>
    );
  }
  if (icon === "okx") {
    return (
      <svg viewBox="0 0 32 32" fill="currentColor" className="absolute -left-3 -bottom-5 h-34 w-34 opacity-[0.07]">
        <rect x="1" y="1" width="12" height="12" rx="2" />
        <rect x="19" y="1" width="12" height="12" rx="2" />
        <rect x="1" y="19" width="12" height="12" rx="2" />
        <rect x="19" y="19" width="12" height="12" rx="2" />
      </svg>
    );
  }
  if (icon === "x") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="absolute -left-2 -bottom-4 h-32 w-32 opacity-[0.06]">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="absolute -left-3 -bottom-4 h-34 w-34 opacity-[0.08]">
      <path d="M7.172 2.757L10.414 6h3.171l3.243-3.243a1 1 0 111.414 1.414L16.414 6H18a3 3 0 013 3v9a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3h1.586L5.757 4.172a1 1 0 011.415-1.415zM18 8H6a1 1 0 00-1 1v9a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 00-1-1zM8.5 11a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  );
}

export function ProofCard({ attestation, shareUrl }: ProofCardProps) {
  const [flipped, setFlipped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const card = attestation.card;
  const fallbackStyle = PLATFORM_STYLES[attestation.platform];
  const gradient = card?.gradient ?? fallbackStyle?.gradient ?? ["#2E3339", "#1E2024"];
  const accent = card?.accent ?? fallbackStyle?.accent ?? "#848C96";
  const icon = card?.icon ?? fallbackStyle?.icon ?? "binance";

  const statement = card?.statement ?? {
    before: attestation.label,
    highlight: attestation.value,
    after: `on ${attestation.platform}`,
  };

  const date = new Date(attestation.timestamp).toISOString().split("T")[0];

  const handleShareX = useCallback(() => {
    const text = `I just verified my ${attestation.label} on ${attestation.platform} using zkTLS\n\nResult: ${attestation.value}\n\nVerify yours`;
    const url = shareUrl ?? (typeof window !== "undefined" ? window.location.href : "");
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
    );
  }, [attestation, shareUrl]);

  const handleClick = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const next = !flipped;
    setFlipped(next);
    el.style.transform = next ? "perspective(800px) rotateY(180deg)" : "perspective(800px) rotateX(0deg) rotateY(0deg)";
  }, [flipped]);

  const cardBg = {
    background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 50%, ${gradient[0]} 100%)`,
    boxShadow: `0 4px 24px -4px ${gradient[0]}40, 0 2px 8px -2px rgba(0,0,0,0.2)`,
  };

  const glassOverlay = {
    border: "1px solid rgba(255,255,255,0.15)",
    background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.05) 100%)",
  };

  return (
    <div className="proof-card-container" style={{ width: "100%", aspectRatio: "5 / 3" }}>
      <div
        ref={containerRef}
        className="relative h-full w-full cursor-pointer"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.4, 1.35, 0.5, 0.97)",
        }}
        onClick={handleClick}
      >
        {/* ===== FRONT ===== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl px-5 py-3"
          style={{ ...cardBg, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", pointerEvents: flipped ? "none" : "auto" }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-xl" style={glassOverlay} />

          {/* Diagonal shine sweep — triggered on hover */}
          <div
            className="proof-card-shine pointer-events-none absolute inset-0 z-20 rounded-xl"
          />

          <div className="pointer-events-none text-white">
            <PlatformWatermark icon={icon} />
          </div>

          {/* Header: brand + platform */}
          <div className="absolute top-3 left-5 z-10">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">ZK Card</span>
          </div>

          {/* Statement — two lines */}
          <div className="relative z-10 flex h-full flex-col justify-center px-1">
            <p
              className="text-[14px] font-normal tracking-wide text-white"
              style={{
                fontFamily: "var(--font-script), cursive",
                textShadow: `0 0 12px ${accent}40, 0 0 36px ${accent}15`,
              }}
            >
              {statement.before.split(/(0x[a-fA-F0-9]+\.{3}[a-fA-F0-9]+)/).map((part, i) =>
                /^0x[a-fA-F0-9]+\.{3}[a-fA-F0-9]+$/.test(part) ? (
                  <span
                    key={i}
                    className="not-italic"
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textShadow: `1px 1px 0 rgba(255,255,255,0.6), 2px 2px 0 rgba(255,255,255,0.3), -1px -1px 0 rgba(0,0,0,0.4), -2px -2px 0 rgba(0,0,0,0.2), 3px 3px 5px rgba(0,0,0,0.35)`,
                    }}
                  >
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </p>
            <p
              className="mt-1.5 text-right text-base font-semibold tracking-wider text-white"
              style={{ textShadow: `0 0 20px ${accent}90, 0 0 48px ${accent}30` }}
            >
              {statement.highlight}
            </p>
          </div>

          {/* Footer */}
          <div className="absolute right-5 bottom-3 left-5 z-10 flex items-center justify-end">
            <span className="text-[9px] text-white/35">{date}</span>
          </div>
        </div>

        {/* ===== BACK ===== */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl"
          style={{
            ...cardBg,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-xl" style={glassOverlay} />

          <div className="pointer-events-none text-white">
            <PlatformWatermark icon={icon} />
          </div>

          <span
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareX(); }}
            className="relative z-10 cursor-pointer text-sm font-semibold uppercase tracking-widest text-white transition-opacity hover:opacity-80"
            style={{
              textShadow: "1px 1px 0 rgba(255,255,255,0.6), 2px 2px 0 rgba(255,255,255,0.3), -1px -1px 0 rgba(0,0,0,0.4), -2px -2px 0 rgba(0,0,0,0.2), 3px 3px 5px rgba(0,0,0,0.35)",
            }}
          >
            Share on X
          </span>
        </div>
      </div>
    </div>
  );
}
