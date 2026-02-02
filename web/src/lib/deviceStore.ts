import { sql } from "@vercel/postgres";

export interface DeviceRecord {
  keyId: string;
  publicKeyDer: string; // base64 DER
  counter: number;
  evmAddress?: string;
  passportHash?: string;
}

function hasDb(): boolean {
  return !!process.env.POSTGRES_URL;
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS devices (
      key_id TEXT PRIMARY KEY,
      public_key_der TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      evm_address TEXT,
      passport_hash TEXT
    )
  `;
}

let tableReady: Promise<void> | null = null;
function init() {
  if (!tableReady) tableReady = ensureTable();
  return tableReady;
}

export async function getDevice(keyId: string): Promise<DeviceRecord | undefined> {
  if (!hasDb()) return undefined;
  await init();
  const { rows } = await sql`SELECT * FROM devices WHERE key_id = ${keyId}`;
  if (rows.length === 0) return undefined;
  const r = rows[0];
  return {
    keyId: r.key_id,
    publicKeyDer: r.public_key_der,
    counter: r.counter,
    evmAddress: r.evm_address ?? undefined,
    passportHash: r.passport_hash ?? undefined,
  };
}

export async function saveDevice(record: DeviceRecord) {
  if (!hasDb()) return;
  await init();
  await sql`
    INSERT INTO devices (key_id, public_key_der, counter, evm_address, passport_hash)
    VALUES (${record.keyId}, ${record.publicKeyDer}, ${record.counter}, ${record.evmAddress ?? null}, ${record.passportHash ?? null})
    ON CONFLICT (key_id) DO UPDATE SET
      public_key_der = EXCLUDED.public_key_der,
      counter = EXCLUDED.counter,
      evm_address = EXCLUDED.evm_address,
      passport_hash = EXCLUDED.passport_hash
  `;
}

export async function updateDevice(keyId: string, updates: Partial<Omit<DeviceRecord, "keyId">>) {
  if (!hasDb()) throw new Error("Database not configured");
  await init();
  const existing = await getDevice(keyId);
  if (!existing) throw new Error(`Device not found: ${keyId}`);
  const merged = { ...existing, ...updates };
  await sql`
    UPDATE devices SET
      public_key_der = ${merged.publicKeyDer},
      counter = ${merged.counter},
      evm_address = ${merged.evmAddress ?? null},
      passport_hash = ${merged.passportHash ?? null}
    WHERE key_id = ${keyId}
  `;
}

export async function findDeviceByAddress(evmAddress: string): Promise<DeviceRecord | undefined> {
  if (!hasDb()) return undefined;
  await init();
  const { rows } = await sql`SELECT * FROM devices WHERE LOWER(evm_address) = ${evmAddress.toLowerCase()}`;
  if (rows.length === 0) return undefined;
  const r = rows[0];
  return {
    keyId: r.key_id,
    publicKeyDer: r.public_key_der,
    counter: r.counter,
    evmAddress: r.evm_address ?? undefined,
    passportHash: r.passport_hash ?? undefined,
  };
}
