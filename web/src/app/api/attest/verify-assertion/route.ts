import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { decode } from "cbor-x";
import { getDevice, updateDevice } from "@/lib/deviceStore";

export async function POST(req: NextRequest) {
  try {
    const { assertion, keyId, passportHash, evmAddress } = await req.json();
    if (!assertion || !keyId || !passportHash || !evmAddress) {
      return NextResponse.json(
        { success: false, error: "assertion, keyId, passportHash, and evmAddress are required" },
        { status: 400 },
      );
    }

    const device = getDevice(keyId);
    if (!device) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 });
    }

    // Decode assertion
    const raw = Buffer.from(assertion, "base64");
    const parsed = decode(raw);
    const signature: Buffer = Buffer.from(parsed.signature);
    const authenticatorData: Buffer = Buffer.from(parsed.authenticatorData);

    // Extract counter (bytes 33-36 big-endian)
    const counter = authenticatorData.readUInt32BE(33);
    if (counter <= device.counter) {
      return NextResponse.json(
        { success: false, error: `Replay: counter ${counter} <= ${device.counter}` },
        { status: 400 },
      );
    }

    // Rebuild payload (compact JSON, matching Python separators=(',',':'))
    const payload = JSON.stringify({ passportHash, evmAddress });
    const clientDataHash = crypto.createHash("sha256").update(payload).digest();
    const nonce = crypto.createHash("sha256").update(Buffer.concat([authenticatorData, clientDataHash])).digest();

    // Load stored public key and verify ECDSA signature
    const publicKeyDer = Buffer.from(device.publicKeyDer, "base64");
    const pubKey = crypto.createPublicKey({ key: publicKeyDer, format: "der", type: "spki" });

    const valid = crypto.verify("sha256", nonce, pubKey, signature);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // Update device record
    updateDevice(keyId, { counter, evmAddress, passportHash });

    return NextResponse.json({ success: true, evmAddress, passportHash });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Assertion verification failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
