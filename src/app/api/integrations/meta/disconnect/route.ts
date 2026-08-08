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

    const connection = await getConnection(organizationId, "meta");

    if (!connection || connection.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          provider: "meta",
          stage: "disconnect",
          disconnected: false,
          version: 1,
          message: "Meta is not connected.",
        },
        {
          status: 400,
        }
      );
    }

    await disconnect(organizationId, "meta");

    return NextResponse.json({
      success: true,
      provider: "meta",
      stage: "disconnect",
      disconnected: true,
      version: 1,
      message: "Meta disconnected successfully.",
    });
  } catch (error: any) {
    console.error("Meta disconnect failed:", error);

    return NextResponse.json(
      {
        success: false,
        provider: "meta",
        stage: "disconnect",
        disconnected: false,
        version: 1,
        message: error?.message || "Unable to disconnect Meta.",
      },
      {
        status: 500,
      }
    );
  }
}