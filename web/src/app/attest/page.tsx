"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { ProofCard } from "@/components/ProofCard";
import { saveAttestation, parseAttestationData, type StoredAttestation } from "@/lib/attestations";
import { TEMPLATES, type Template } from "@/lib/templates";

type Step = "idle" | "init" | "sign" | "attest" | "verify" | "done" | "error";

function PlatformIcon({ icon }: { icon: Template["icon"]; className?: string }) {
  const cls = "";
  if (icon === "binance") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    );
  }
  if (icon === "okx") {
    return (
      <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" className={cls}>
        <rect x="1" y="1" width="12" height="12" rx="2" />
        <rect x="19" y="1" width="12" height="12" rx="2" />
        <rect x="1" y="19" width="12" height="12" rx="2" />
        <rect x="19" y="19" width="12" height="12" rx="2" />
      </svg>
    );
  }
  if (icon === "x") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M7.172 2.757L10.414 6h3.171l3.243-3.243a1 1 0 111.414 1.414L16.414 6H18a3 3 0 013 3v9a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3h1.586L5.757 4.172a1 1 0 011.415-1.415zM18 8H6a1 1 0 00-1 1v9a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 00-1-1zM8.5 11a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  );
}

const stepLabels: Record<Step, string> = {
  idle: "",
  init: "Initializing Primus extension...",
  sign: "Generating & signing request...",
  attest: "Running attestation...",
  verify: "Verifying proof...",
  done: "Complete!",
  error: "Failed",
};

export default function AttestPage() {
  const { address: connectedAddress, isConnected } = useAccount();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedAttestation, setSavedAttestation] = useState<StoredAttestation | null>(null);

  const walletAddress = connectedAddress ?? "";

  const showModal = step !== "idle";

  const closeModal = useCallback(() => {
    if (!["idle", "error", "done"].includes(step)) return; // can't close while running
    setStep("idle");
    setError(null);
    setSelectedTemplate(null);
    setSavedAttestation(null);
  }, [step]);

  const startAttestation = useCallback(async (template?: Template) => {
    const t = template ?? selectedTemplate;
    if (!walletAddress) {
      setError("Please connect your wallet first");
      setStep("error");
      return;
    }
    if (!t) return;
    setSelectedTemplate(t);
    setError(null);
    setSavedAttestation(null);

    try {
      const appId = process.env.NEXT_PUBLIC_PRIMUS_APP_ID;
      if (!appId) throw new Error("NEXT_PUBLIC_PRIMUS_APP_ID is not configured");

      setStep("init");
      const { PrimusZKTLS } = await import("@primuslabs/zktls-js-sdk");
      const clientPrimus = new PrimusZKTLS();
      await clientPrimus.init(appId);

      setStep("sign");
      const signRes = await fetch("/api/primus/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: t.id, userAddress: walletAddress }),
      });
      const signData = await signRes.json();
      if (!signData.success) throw new Error(signData.error);

      setStep("attest");
      const attestation = await clientPrimus.startAttestation(signData.signedRequestStr);

      setStep("verify");
      const verifyRes = await fetch("/api/primus/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attestation }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error(verifyData.error);

      const raw = attestation as Record<string, unknown>;
      const parsed = parseAttestationData(raw, t);
      const signatures = (raw.signatures as string[]) ?? [];
      const attestors = (raw.attestors as Array<{ attestorAddr: string }>) ?? [];

      const stored: StoredAttestation = {
        id: `${walletAddress}-${t.id}-${Date.now()}`,
        type: t.parseField,
        platform: parsed.platform,
        label: parsed.label,
        value: parsed.value,
        timestamp: (raw.timestamp as number) ?? Date.now(),
        walletAddress,
        verified: verifyData.verified,
        attestorAddr: attestors[0]?.attestorAddr ?? "",
        signature: signatures[0] ?? "",
        card: {
          gradient: t.gradient,
          accent: t.accent,
          icon: t.icon,
          statement: t.proofStatement(parsed.value, `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`),
        },
      };

      saveAttestation(stored);
      setSavedAttestation(stored);
      setStep("done");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Attestation failed";
      setError(message);
      setStep("error");
    }
  }, [walletAddress, selectedTemplate, isConnected]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[960px] px-4 py-6">
        <h1 className="mb-1 text-lg font-bold text-text">Verify your credentials</h1>
        <p className="mb-5 text-sm text-text-alt">
          Choose a template to prove ownership using zkTLS.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => startAttestation(t)}
              disabled={showModal}
              className={`flex items-start gap-3 rounded-lg border border-border-muted bg-bg p-3 text-left transition-all hover:border-transparent hover:shadow-md ${showModal ? "pointer-events-none opacity-50" : ""}`}
              style={{ boxShadow: undefined }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px -4px ${t.gradient[0]}40`; e.currentTarget.style.borderColor = `${t.gradient[0]}60`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
            >
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
                style={{ background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})` }}
              >
                <PlatformIcon icon={t.icon} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-text">{t.name}</div>
                <div className="mt-0.5 text-xs text-text-muted">{t.description}</div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
          <div
            className="relative mx-4 w-full max-w-[420px] rounded-2xl border border-border-muted bg-bg p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button — only when done or error */}
            {["error", "done"].includes(step) && (
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-text-muted transition-colors hover:text-text"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* In progress */}
            {!["done", "error"].includes(step) && (
              <div className="flex flex-col items-center gap-4 py-4">
                <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium text-text">{selectedTemplate?.name}</p>
                  <p className="mt-1 text-xs text-text-muted">{stepLabels[step]}</p>
                </div>
              </div>
            )}

            {/* Error */}
            {step === "error" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-muted">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-text">Attestation failed</p>
                  <p className="mt-1 text-xs text-text-muted">{error}</p>
                </div>
                <div className="flex w-full gap-2">
                  <Button variant="secondary" onClick={closeModal} className="flex-1">
                    Close
                  </Button>
                  <Button variant="accent" onClick={() => startAttestation()} className="flex-1">
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Done */}
            {step === "done" && savedAttestation && (
              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium text-text">Verification successful</p>
                <ProofCard
                  attestation={savedAttestation}
                  shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/profile/${walletAddress}`}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
