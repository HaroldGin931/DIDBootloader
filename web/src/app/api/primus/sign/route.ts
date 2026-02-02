import { NextRequest, NextResponse } from "next/server";
import { getPrimusInstance } from "@/lib/primus";

export async function POST(req: NextRequest) {
  try {
    const { templateId, userAddress } = await req.json();
    if (!templateId || !userAddress) {
      return NextResponse.json(
        { success: false, error: "templateId and userAddress are required" },
        { status: 400 },
      );
    }

    const primus = await getPrimusInstance();

    // Generate request params server-side (needs appId from init)
    const request = primus.generateRequestParams(templateId, userAddress);
    request.setAttMode({ algorithmType: "proxytls" });
    const requestStr = request.toJsonString();

    // Sign with appSecret (server-side only)
    const signedRequestStr = await primus.sign(requestStr);

    return NextResponse.json({ success: true, signedRequestStr });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Sign failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
