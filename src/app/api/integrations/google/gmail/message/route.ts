import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/integrations/google/get-google-access-token";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId");
    const messageId = request.nextUrl.searchParams.get("id");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Missing organizationId." },
        { status: 400 }
      );
    }

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Missing message id." },
        { status: 400 }
      );
    }

    const { data: integration } = await supabaseAdmin
      .from("organization_integrations")
      .select("status,provider_account_email")
      .eq("organization_id", organizationId)
      .eq("provider", "google")
      .single();

    if (!integration || integration.status !== "connected") {
      return NextResponse.json(
        { success: false, error: "Google Workspace is not connected." },
        { status: 404 }
      );
    }

    const accessToken = await getGoogleAccessToken(organizationId);

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const gmail = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            gmail?.error?.message ??
            `Failed to load Gmail message (${response.status})`,
        },
        { status: 500 }
      );
    }

    const headers = gmail.payload?.headers ?? [];
    const find = (name: string) =>
      headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value ?? "";

    const decodeBody = (part: any): string => {
      if (!part) return "";
      if (part.body?.data) {
        return Buffer.from(
          part.body.data.replace(/-/g, "+").replace(/_/g, "/"),
          "base64"
        ).toString("utf8");
      }
      if (part.parts) {
        for (const child of part.parts) {
          const body = decodeBody(child);
          if (body) return body;
        }
      }
      return "";
    };

    return NextResponse.json({
      success: true,
      account: integration.provider_account_email,
      message: {
        id: gmail.id,
        threadId: gmail.threadId,
        snippet: gmail.snippet,
        labelIds: gmail.labelIds ?? [],
        from: find("From"),
        to: find("To"),
        subject: find("Subject"),
        date: find("Date"),
        body: decodeBody(gmail.payload),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? "Failed to load Gmail message.",
      },
      { status: 500 }
    );
  }
}
