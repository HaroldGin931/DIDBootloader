import { TEMPLATES, type Template } from "./templates";

export interface StoredAttestation {
  id: string;
  type: string;
  platform: string;
  label: string;
  value: string;
  timestamp: number;
  walletAddress: string;
  verified: boolean;
  attestorAddr: string;
  signature: string;
  /** Card display metadata */
  card?: {
    gradient: [string, string];
    accent: string;
    icon: string;
    statement: { before: string; highlight: string; after: string };
  };
}

const STORAGE_KEY = "did_attestations";

export function saveAttestation(att: StoredAttestation): void {
  const existing = getAttestations(att.walletAddress);
  // Dedupe by id
  const updated = existing.filter((a) => a.id !== att.id);
  updated.push(att);
  const all = getAllAttestations();
  all[att.walletAddress.toLowerCase()] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getAttestations(walletAddress: string): StoredAttestation[] {
  const all = getAllAttestations();
  return all[walletAddress.toLowerCase()] ?? [];
}

function getAllAttestations(): Record<string, StoredAttestation[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function parseAttestationData(
  rawAttestation: Record<string, unknown>,
  template?: Template,
): {
  value: string;
  platform: string;
  label: string;
} {
  const data = (rawAttestation.data as string) ?? "";

  // If template provided, use its parseField to extract value
  if (template) {
    const fieldRegex = new RegExp(`"${template.parseField}":"([^"]+)"`);
    const match = data.match(fieldRegex);
    const rawValue = match ? match[1] : null;

    return {
      value: rawValue ? template.formatValue(rawValue) : data,
      platform: template.platform,
      label: template.name,
    };
  }

  // Fallback: try to match against all templates
  for (const t of TEMPLATES) {
    const fieldRegex = new RegExp(`"${t.parseField}":"([^"]+)"`);
    const match = data.match(fieldRegex);
    if (match) {
      return {
        value: t.formatValue(match[1]),
        platform: t.platform,
        label: t.name,
      };
    }
  }

  // Ultimate fallback
  return {
    value: data,
    platform: "Unknown",
    label: "Attestation",
  };
}
