import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { decode } from "cbor-x";
import { APPLE_APP_ATTEST_ROOT_CA_PEM } from "@/lib/appleRootCA";
import { saveDevice } from "@/lib/deviceStore";

function extractNonceFromExtension(payload: Buffer): Buffer {
  function findOctet32(b: Buffer, depth = 0): Buffer | null {
    if (depth > 10 || b.length < 2) return null;
    let i = 0;
    while (i < b.length) {
      if (i >= b.length) break;
      const tag = b[i];
      i++;
      if (i >= b.length) break;
      let length = b[i];
      i++;
      if (length & 0x80) {
        const n = length & 0x7f;
        if (i + n > b.length) break;
        length = 0;
        for (let j = 0; j < n; j++) {
          length = (length << 8) | b[i + j];
        }
        i += n;
      }
      if (i + length > b.length) break;
      const value = b.subarray(i, i + length);
      i += length;
      if (tag === 0x04 && value.length === 32) return Buffer.from(value);
      if ((tag & 0x20) || tag === 0x30 || tag === 0x31 || tag === 0x04) {
        const result = findOctet32(Buffer.from(value), depth + 1);
        if (result) return result;
      }
    }
    return null;
  }
  const result = findOctet32(payload);
  if (!result) throw new Error("Could not find 32-byte nonce in extension");
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { attestation, challenge, keyId } = await req.json();
    if (!attestation || !challenge || !keyId) {
      return NextResponse.json(
        { success: false, error: "attestation, challenge, and keyId are required" },
        { status: 400 },
      );
    }

    const raw = Buffer.from(attestation, "base64");
    const att = decode(raw);
    const fmt = att.fmt;
    if (fmt !== "apple-appattest") {
      return NextResponse.json({ success: false, error: `Invalid format: ${fmt}` }, { status: 400 });
    }

    const attStmt = att.attStmt;
    const authData: Buffer = Buffer.from(att.authData);
    const x5c: Buffer[] = attStmt.x5c;

    if (!x5c || x5c.length < 2) {
      return NextResponse.json({ success: false, error: "Certificate chain too short" }, { status: 400 });
    }

    // Parse authData
    const flags = authData[32];
    const credIdLen = authData.readUInt16BE(53);
    const credentialId = authData.subarray(55, 55 + credIdLen);

    // Verify AT flag
    if (!(flags & 0x40)) {
      return NextResponse.json({ success: false, error: "AT flag not set" }, { status: 400 });
    }

    // Build certificate chain and verify
    const leafCert = new crypto.X509Certificate(Buffer.from(x5c[0]));
    const intermediateCert = new crypto.X509Certificate(Buffer.from(x5c[1]));
    const rootCert = new crypto.X509Certificate(APPLE_APP_ATTEST_ROOT_CA_PEM);

    if (!intermediateCert.verify(rootCert.publicKey)) {
      return NextResponse.json({ success: false, error: "Intermediate cert verification failed" }, { status: 400 });
    }
    if (!leafCert.verify(intermediateCert.publicKey)) {
      return NextResponse.json({ success: false, error: "Leaf cert verification failed" }, { status: 400 });
    }

    // Extract EC P-256 public key from leaf cert
    const leafPubKey = leafCert.publicKey;
    const pubKeyDer = leafPubKey.export({ type: "spki", format: "der" });

    // Get uncompressed point (last 65 bytes of the SPKI DER for P-256)
    // SPKI DER for P-256: 26 bytes header + 65 bytes point
    const uncompressedPoint = pubKeyDer.subarray(pubKeyDer.length - 65);
    if (uncompressedPoint[0] !== 0x04) {
      return NextResponse.json({ success: false, error: "Public key is not uncompressed point" }, { status: 400 });
    }

    // Verify credentialId === SHA256(publicKey)
    const keyHash = crypto.createHash("sha256").update(uncompressedPoint).digest();
    if (!credentialId.equals(keyHash)) {
      return NextResponse.json({ success: false, error: "credentialId != SHA256(publicKey)" }, { status: 400 });
    }

    // Verify nonce from Apple extension OID 1.2.840.113635.100.8.2
    let certNonce: Buffer | null = null;
    // Parse extensions from leaf cert raw DER to find Apple nonce
    const leafRaw = leafCert.raw;
    // OID 1.2.840.113635.100.8.2 DER: 06 09 2a 86 48 86 f7 63 64 08 02
    const oidBytes = Buffer.from("06092a864886f763640802", "hex");
    const idx = leafRaw.indexOf(oidBytes);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Nonce extension not found" }, { status: 400 });
    }
    // The extension value follows the OID in the DER structure
    // Skip OID, then find the OCTET STRING wrapper
    const afterOid = leafRaw.subarray(idx + oidBytes.length);
    certNonce = extractNonceFromExtension(Buffer.from(afterOid));

    // Compute expected nonce: SHA256(authData || SHA256(challenge))
    const challengeBytes = Buffer.from(challenge, "utf-8");
    const clientDataHash = crypto.createHash("sha256").update(challengeBytes).digest();
    const expectedNonce = crypto.createHash("sha256").update(Buffer.concat([authData, clientDataHash])).digest();

    // Also try method 1: SHA256(authData || challenge)
    const expectedNonce1 = crypto.createHash("sha256").update(Buffer.concat([authData, challengeBytes])).digest();

    if (!certNonce.equals(expectedNonce) && !certNonce.equals(expectedNonce1)) {
      return NextResponse.json({ success: false, error: "Nonce mismatch" }, { status: 400 });
    }

    // Store device
    const publicKeyDerB64 = pubKeyDer.toString("base64");
    await saveDevice({ keyId, publicKeyDer: publicKeyDerB64, counter: 0 });

    return NextResponse.json({ success: true, publicKey: publicKeyDerB64 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
