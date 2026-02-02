import { NextRequest, NextResponse } from "next/server";
import { findDeviceByAddress } from "@/lib/deviceStore";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ success: false, error: "address is required" }, { status: 400 });
  }

  const device = findDeviceByAddress(address);
  return NextResponse.json({
    success: true,
    passportHash: device?.passportHash ?? null,
  });
}
