import { NextRequest, NextResponse } from "next/server";
import { getPrimusInstance } from "@/lib/primus";

export async function POST(req: NextRequest) {
  try {
    const { attestation } = await req.json();
    if (!attestation) {
      return NextResponse.json(
        { success: false, error: "attestation is required" },
        { status: 400 },
      );
    }

    const primus = await getPrimusInstance();
    const verified = await primus.verifyAttestation(attestation);
    return NextResponse.json({ success: true, verified });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Verify failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
