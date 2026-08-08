import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/integrations/google/get-google-access-token";

export async function POST(request: NextRequest) {
  try {
    const {
      organizationId,
      query,
      maxResults = 25,
    } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing organizationId.",
        },
        { status: 400 }
      );
    }

    const { data: integration } = await supabaseAdmin
      .from("organization_integrations")
      .select("status, provider_account_email")
      .eq("organization_id", organizationId)
      .eq("provider", "google")
      .single();

    if (!integration || integration.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          error: "Google Workspace is not connected.",
        },
        { status: 404 }
      );
    }

    const accessToken = await getGoogleAccessToken(organizationId);

    const searchResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
        query ?? ""
      )}&maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const search = await searchResponse.json();

    if (!searchResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            search?.error?.message ??
            `Failed to search Gmail (${searchResponse.status})`,
        },
        { status: 500 }
      );
    }

    const messages = [];

    for (const item of search.messages ?? []) {
      const messageResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!messageResponse.ok) continue;

      const gmail = await messageResponse.json();

      const headers = gmail.payload?.headers ?? [];

      const find = (name: string) =>
        headers.find(
          (header: any) =>
            header.name?.toLowerCase() === name.toLowerCase()
        )?.value ?? "";

      messages.push({
        id: gmail.id,
        threadId: gmail.threadId,
        from: find("From"),
        subject: find("Subject"),
        date: find("Date"),
        snippet: gmail.snippet,
        unread: gmail.labelIds?.includes("UNREAD") ?? false,
      });
    }

    return NextResponse.json({
      success: true,
      account: integration.provider_account_email,
      query,
      count: messages.length,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? "Failed to search Gmail.",
      },
      { status: 500 }
    );
  }
}