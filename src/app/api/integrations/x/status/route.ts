import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getConnection } from "@/lib/integrations/connection-store";

const PROVIDER = "x";

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
      account: connected
        ? {
            id:
              connection?.metadata?.x_user_id ??
              connection?.metadata?.provider_account_id ??
              null,
            username: connection?.metadata?.username ?? null,
            name: connection?.metadata?.name ?? null,
          }
        : null,
    });
  } catch (error: any) {
    console.error("X status failed:", error);

    return NextResponse.json(
      {
        success: false,
        provider: PROVIDER,
        connected: false,
        error: error?.message || "Unable to load X connection status.",
      },
      { status: 500 }
    );
  }
}
