import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/integrations/google/get-google-access-token";

async function getActiveOrganizationId() {
  const cookieStore = await cookies();
  const activeOrganizationId =
    cookieStore.get("active_organization_id")?.value;

  if (!activeOrganizationId) {
    throw new Error("No active campaign selected.");
  }

  return activeOrganizationId;
}

export async function GET() {
  try {
    const organizationId = await getActiveOrganizationId();

    const { data: integration, error } = await supabaseAdmin
      .from("organization_integrations")
      .select("status,provider_account_email")
      .eq("organization_id", organizationId)
      .eq("provider", "google")
      .single();

    if (error) throw error;

    if (
      !integration ||
      integration.status !== "connected"
    ) {
      return NextResponse.json({
        success: false,
        messages: [],
        error: "Google Workspace is not connected.",
      });
    }


    const accessToken = await getGoogleAccessToken(organizationId);

    const listResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!listResponse.ok) {
      const errorBody = await listResponse.text();

      throw new Error(
        `Failed to load Gmail message list (${listResponse.status})`
      );
    }

    const listData = await listResponse.json();

    const ids: { id: string }[] = listData.messages ?? [];

    const messages = await Promise.all(
      ids.map(async ({ id }) => {
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) return null;

        const message = await response.json();

        const headers = message.payload?.headers ?? [];

        const header = (name: string) =>
          headers.find((h: any) => h.name === name)?.value ?? "";

        return {
          id: message.id,
          threadId: message.threadId,
          from: header("From"),
          subject: header("Subject"),
          date: header("Date"),
          snippet: message.snippet,
          unread: (message.labelIds ?? []).includes("UNREAD"),
        };
      })
    );

    return NextResponse.json({
      success: true,
      account: integration.provider_account_email,
      messages: messages.filter(Boolean),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        messages: [],
        error: error?.message ?? "Failed to load Gmail messages.",
      },
      { status: 500 }
    );
  }
}
