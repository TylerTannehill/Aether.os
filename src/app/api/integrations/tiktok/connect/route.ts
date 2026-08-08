import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      provider: "tiktok",
      stage: "connect",
      configured: false,
      version: 1,
      message: "TikTok OAuth has not been configured.",
    },
    {
      status: 501,
    }
  );
}