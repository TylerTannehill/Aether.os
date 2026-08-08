import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      provider: "youtube",
      stage: "connect",
      configured: false,
      version: 1,
      message: "YouTube OAuth has not been configured.",
    },
    {
      status: 501,
    }
  );
}