import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      provider: "meta",
      stage: "callback",
      configured: false,
      version: 1,
      message: "Meta OAuth callback has not been configured.",
    },
    {
      status: 501,
    }
  );
}