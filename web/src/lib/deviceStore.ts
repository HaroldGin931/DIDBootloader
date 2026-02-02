import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

export interface DeviceRecord {
  keyId: string;
  publicKeyDer: string; // base64 DER
  counter: number;
  evmAddress?: string;
  passportHash?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "devices.json");

function readDb(): Record<string, DeviceRecord> {
  if (!existsSync(DB_PATH)) return {};
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeDb(db: Record<string, DeviceRecord>) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getDevice(keyId: string): DeviceRecord | undefined {
  return readDb()[keyId];
}

export function saveDevice(record: DeviceRecord) {
  const db = readDb();
  db[record.keyId] = record;
  writeDb(db);
}

export function updateDevice(keyId: string, updates: Partial<Omit<DeviceRecord, "keyId">>) {
  const db = readDb();
  const existing = db[keyId];
  if (!existing) throw new Error(`Device not found: ${keyId}`);
  db[keyId] = { ...existing, ...updates };
  writeDb(db);
}

export function findDeviceByAddress(evmAddress: string): DeviceRecord | undefined {
  const db = readDb();
  const addr = evmAddress.toLowerCase();
  return Object.values(db).find((d) => d.evmAddress?.toLowerCase() === addr);
}
