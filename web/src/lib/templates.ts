export interface Template {
  id: string;
  name: string;
  platform: string;
  icon: "binance" | "x" | "bilibili" | "okx";
  description: string;
  parseField: string;
  parsePath: string;
  formatValue: (v: string) => string;
  /** Generate a proof statement — value will be highlighted in the card. identity is passport ID or truncated wallet */
  proofStatement: (value: string, identity: string) => { before: string; highlight: string; after: string };
  /** Card gradient [from, to] */
  gradient: [string, string];
  /** Platform accent color */
  accent: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "369e1db8-47c9-4dc6-85b5-037cd02d3383",
    name: "Binance 30D Spot PnL",
    platform: "Binance",
    icon: "binance",
    description: "30-Day Spot Account PnL Rate",
    parseField: "spotPnlRate",
    parsePath: "$.data.cumulativeCurrMonth.spotPnlRate",
    formatValue: (v: string) => `${(parseFloat(v) * 100).toFixed(2)}%`,
    proofStatement: (v, id) => ({
      before: `Cryptographically proven that 30-day spot PnL of ${id} is`,
      highlight: v,
      after: "",
    }),
    gradient: ["#F0B90B", "#FCD535"],
    accent: "#F0B90B",
  },
  {
    id: "9859330b-b94f-47a4-8f13-0ca56dabe273",
    name: "Binance KYC Status",
    platform: "Binance",
    icon: "binance",
    description: "KYC Verification Status",
    parseField: "kycStatus",
    parsePath: "user-kyc-status",
    formatValue: (v: string) => (v === "2" ? "Verified" : v),
    proofStatement: (v, id) => ({
      before: `Cryptographically proven that KYC status of ${id} is`,
      highlight: v,
      after: "",
    }),
    gradient: ["#F0B90B", "#FCD535"],
    accent: "#F0B90B",
  },
  {
    id: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
    name: "X (Twitter) Account",
    platform: "X",
    icon: "x",
    description: "Account Ownership Verification",
    parseField: "screen_name",
    parsePath: "$.screen_name",
    formatValue: (v: string) => `@${v}`,
    proofStatement: (v, id) => ({
      before: `Cryptographically proven that X account of ${id} is`,
      highlight: v,
      after: "",
    }),
    gradient: ["#1A1A1A", "#333333"],
    accent: "#E7E9EA",
  },
  {
    id: "41e26070-8d57-4e97-b0b3-f9b7c7359f21",
    name: "Bilibili Account",
    platform: "Bilibili",
    icon: "bilibili",
    description: "Account Ownership Verification",
    parseField: "uname",
    parsePath: "$.data.uname",
    formatValue: (v: string) => v,
    proofStatement: (v, id) => ({
      before: `Cryptographically proven that Bilibili account of ${id} is`,
      highlight: v,
      after: "",
    }),
    gradient: ["#00A1D6", "#23C9ED"],
    accent: "#00A1D6",
  },
  {
    id: "555d729f-074a-4030-a188-469cd5fd8115",
    name: "OKX KYC Status",
    platform: "OKX",
    icon: "okx",
    description: "KYC Verification Status",
    parseField: "kycLevel",
    parsePath: "$.data.kycLevel",
    formatValue: (v: string) => (v === "2" ? "Verified" : v),
    proofStatement: (v, id) => ({
      before: `Cryptographically proven that KYC status of ${id} is`,
      highlight: v,
      after: "",
    }),
    gradient: ["#000000", "#1A1A1A"],
    accent: "#FFFFFF",
  },
  {
    id: "3d41e141-18a9-471e-aca5-891e49c0c015",
    name: "OKX Monthly PnL",
    platform: "OKX",
    icon: "okx",
    description: "This Month's PnL Rate",
    parseField: "monthyPnlRate",
    parsePath: "$.data.monthyPnlRate",
    formatValue: (v: string) => `${(parseFloat(v) * 100).toFixed(2)}%`,
    proofStatement: (v, id) => ({
      before: `Cryptographically proven that monthly PnL of ${id} is`,
      highlight: v,
      after: "",
    }),
    gradient: ["#000000", "#1A1A1A"],
    accent: "#FFFFFF",
  },
];

export const PLATFORM_STYLES: Record<string, { gradient: [string, string]; accent: string; icon: Template["icon"] }> = {
  Binance: { gradient: ["#F0B90B", "#FCD535"], accent: "#F0B90B", icon: "binance" },
  X: { gradient: ["#1A1A1A", "#333333"], accent: "#E7E9EA", icon: "x" },
  Bilibili: { gradient: ["#00A1D6", "#23C9ED"], accent: "#00A1D6", icon: "bilibili" },
  OKX: { gradient: ["#000000", "#1A1A1A"], accent: "#FFFFFF", icon: "okx" },
};

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
