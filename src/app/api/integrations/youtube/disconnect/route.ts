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
          provider: "youtube",
          stage: "disconnect",
          disconnected: false,
          version: 1,
          message: "No active organization selected.",
        },
        { status: 400 }
      );
    }

    const connection = await getConnection(organizationId, "youtube");

    if (!connection || connection.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          provider: "youtube",
          stage: "disconnect",
          disconnected: false,
          version: 1,
          message: "YouTube is not connected.",
        },
        {
          status: 400,
        }
      );
    }

    await disconnect(organizationId, "youtube");

    return NextResponse.json({
      success: true,
      provider: "youtube",
      stage: "disconnect",
      disconnected: true,
      version: 1,
      message: "YouTube disconnected successfully.",
    });
  } catch (error: any) {
    console.error("YouTube disconnect failed:", error);

    return NextResponse.json(
      {
        success: false,
        provider: "youtube",
        stage: "disconnect",
        disconnected: false,
        version: 1,
        message: error?.message || "Unable to disconnect YouTube.",
      },
      {
        status: 500,
      }
    );
  }
}