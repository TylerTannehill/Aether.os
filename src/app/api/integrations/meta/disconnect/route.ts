import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  disconnect,
  getConnection,
} from "@/lib/integrations/connection-store";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const organizationId =
      cookieStore.get("active_organization_id")?.value?.trim();

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          provider: "meta",
          stage: "disconnect",
          disconnected: false,
          message: "No active campaign selected.",
        },
        { status: 400 }
      );
    }

    const connection = await getConnection(organizationId, "meta");

    if (!connection || connection.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          provider: "meta",
          stage: "disconnect",
          disconnected: false,
          message: "Meta is not connected for this campaign.",
        },
        { status: 400 }
      );
    }

    await disconnect(organizationId, "meta");

    return NextResponse.json({
      success: true,
      provider: "meta",
      stage: "disconnect",
      disconnected: true,
      message: "Meta disconnected successfully.",
    });
  } catch (error: any) {
    console.error("[META DISCONNECT] Failed", error);

    return NextResponse.json(
      {
        success: false,
        provider: "meta",
        stage: "disconnect",
        disconnected: false,
        message: error?.message || "Unable to disconnect Meta.",
      },
      { status: 500 }
    );
  }
}
