import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      provider: "x",
      stage: "connect",
      configured: false,
      version: 1,
      message: "X OAuth has not been configured.",
    },
    {
      status: 501,
    }
  );
}