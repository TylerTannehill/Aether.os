import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { disconnect, getConnection } from "@/lib/integrations/connection-store";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const organizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          provider: "tiktok",
          stage: "disconnect",
          disconnected: false,
          version: 1,
          message: "No active organization selected.",
        },
        { status: 400 }
      );
    }

    const connection = await getConnection(organizationId, "tiktok");

    if (!connection || connection.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          provider: "tiktok",
          stage: "disconnect",
          disconnected: false,
          version: 1,
          message: "TikTok is not connected.",
        },
        {
          status: 400,
        }
      );
    }

    await disconnect(organizationId, "tiktok");

    return NextResponse.json({
      success: true,
      provider: "tiktok",
      stage: "disconnect",
      disconnected: true,
      version: 1,
      message: "TikTok disconnected successfully.",
    });
  } catch (error: any) {
    console.error("TikTok disconnect failed:", error);

    return NextResponse.json(
      {
        success: false,
        provider: "tiktok",
        stage: "disconnect",
        disconnected: false,
        version: 1,
        message: error?.message || "Unable to disconnect TikTok.",
      },
      {
        status: 500,
      }
    );
  }
}