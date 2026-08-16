import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getConnection } from "@/lib/integrations/connection-store";

const PROVIDER = "youtube";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const organizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          provider: PROVIDER,
          connected: false,
          error: "No active organization selected.",
        },
        { status: 400 }
      );
    }

    const connection = await getConnection(organizationId, PROVIDER);
    const connected = connection?.status === "connected";

    return NextResponse.json({
      success: true,
      provider: PROVIDER,
      connected,
    });
  } catch (error: any) {
    console.error("YouTube status failed:", error);

    return NextResponse.json(
      {
        success: false,
        provider: PROVIDER,
        connected: false,
        error: error?.message || "Unable to load YouTube connection status.",
      },
      { status: 500 }
    );
  }
}
