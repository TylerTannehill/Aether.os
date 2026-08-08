import { NextRequest, NextResponse } from "next/server";

import { disconnect, getConnection } from "@/lib/integrations/connection-store";

async function getOrganizationId(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");

  if (!organizationId) {
    throw new Error("organizationId is required.");
  }

  return organizationId;
}

export async function DELETE(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request);

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