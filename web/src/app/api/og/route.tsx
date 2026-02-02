import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const wallet = searchParams.get("wallet") ?? "0x0000...0000";
  const pnl = searchParams.get("pnl") ?? "N/A";
  const platform = searchParams.get("platform") ?? "Binance";
  const label = searchParams.get("label") ?? "30D Spot PnL";
  const tier = searchParams.get("tier") ?? "Trader";
  const identity = searchParams.get("identity") === "true";
  const ts = searchParams.get("ts") ?? "";

  const date = ts ? new Date(parseInt(ts)).toISOString().split("T")[0] : "—";
  const shortWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  const isNegative = pnl.startsWith("-");
  const pnlColor = pnl === "N/A" ? "#848C96" : isNegative ? "#D6D9DC" : "#FB923C";

  // Tier colors
  const tierColors: Record<string, { accent: string; border: string }> = {
    Unverified: { accent: "#848C96", border: "#3B4046" },
    Verified: { accent: "#CD7F32", border: "#8B6914" },
    Trader: { accent: "#C0C0C0", border: "#71757E" },
    Whale: { accent: "#FFD700", border: "#B8960F" },
    OG: { accent: "#FFD700", border: "#FFD700" },
  };
  const tc = tierColors[tier] ?? tierColors.Trader;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0F11",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: "520",
            display: "flex",
            flexDirection: "column",
            border: `2px solid ${tc.border}`,
            borderRadius: "24",
            background: "linear-gradient(160deg, #1C1E22 0%, #141618 100%)",
            padding: "40",
            boxShadow: `0 0 60px ${tc.border}33`,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "32",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12" }}>
              <div
                style={{
                  width: "36",
                  height: "36",
                  borderRadius: "10",
                  background: `${tc.accent}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18",
                }}
              >
                ◆
              </div>
              <span
                style={{
                  fontSize: "13",
                  fontWeight: "700",
                  letterSpacing: "3",
                  color: tc.accent,
                  textTransform: "uppercase",
                }}
              >
                Verified Credential
              </span>
            </div>
            <span
              style={{
                fontSize: "12",
                fontWeight: "600",
                color: tc.accent,
                border: `1px solid ${tc.border}`,
                borderRadius: "9999",
                padding: "4 12",
              }}
            >
              {tier}
            </span>
          </div>

          {/* PnL */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: "28" }}>
            <span style={{ fontSize: "12", color: "#848C96", marginBottom: "6" }}>
              {label}
            </span>
            <span
              style={{
                fontSize: "42",
                fontWeight: "700",
                color: pnlColor,
                letterSpacing: "-1",
              }}
            >
              {pnl}
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1",
              background: `linear-gradient(90deg, ${tc.border}00, ${tc.border}66, ${tc.border}00)`,
              marginBottom: "20",
            }}
          />

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13", color: "#848C96" }}>Platform</span>
              <span style={{ fontSize: "13", color: "#D6D9DC", fontWeight: "500" }}>
                {platform}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13", color: "#848C96" }}>Identity</span>
              <span style={{ fontSize: "13", color: identity ? "#28A745" : "#848C96", fontWeight: "500" }}>
                {identity ? "✓ Passport Verified" : "Not Verified"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13", color: "#848C96" }}>Wallet</span>
              <span style={{ fontSize: "13", color: "#D6D9DC", fontFamily: "monospace" }}>
                {shortWallet}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13", color: "#848C96" }}>Verified</span>
              <span style={{ fontSize: "13", color: "#D6D9DC" }}>{date}</span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "24",
              paddingTop: "16",
              borderTop: `1px solid ${tc.border}33`,
            }}
          >
            <span style={{ fontSize: "11", color: "#535A61" }}>
              Attestor: Primus zkTLS
            </span>
            <span style={{ fontSize: "11", color: "#535A61" }}>
              did.boot
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
