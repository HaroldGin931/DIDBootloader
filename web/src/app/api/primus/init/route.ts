import { NextResponse } from "next/server";
import { getPrimusInstance } from "@/lib/primus";

export async function POST() {
  try {
    await getPrimusInstance();
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Init failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
