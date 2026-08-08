import { NextRequest, NextResponse } from "next/server";

import {
  disconnect,
  getConnection,
} from "@/lib/integrations/connection-store";

async function getOrganizationId(request: NextRequest) {
  const organizationId =
    request.nextUrl.searchParams.get("organizationId");

  if (!organizationId) {
    throw new Error("organizationId is required.");
  }

  return organizationId;
}

export async function DELETE(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request);

    const connection = await getConnection(
      organizationId,
      "google"
    );

    if (!connection || connection.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          provider: "google",
          stage: "disconnect",
          disconnected: false,
          version: 1,
          message: "Google is not connected.",
        },
        {
          status: 400,
        }
      );
    }

    await disconnect(organizationId, "google");

    return NextResponse.json({
      success: true,
      provider: "google",
      stage: "disconnect",
      disconnected: true,
      version: 1,
      message: "Google disconnected successfully.",
    });
  } catch (error: any) {
    console.error("Google disconnect failed:", error);

    return NextResponse.json(
      {
        success: false,
        provider: "google",
        stage: "disconnect",
        disconnected: false,
        version: 1,
        message:
          error?.message || "Unable to disconnect Google.",
      },
      {
        status: 500,
      }
    );
  }
}