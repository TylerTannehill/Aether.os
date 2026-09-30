import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/integrations/google/get-google-access-token";

export async function POST(request: NextRequest) {
  try {
    const {
      organizationId,
      to,
      subject,
      body,
    } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Missing organizationId." },
        { status: 400 }
      );
    }

    if (!to || !subject || !body) {
      return NextResponse.json(
        { success: false, error: "Missing required email fields." },
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
        {
          success: false,
          error: "Google Workspace is not connected.",
        },
        { status: 404 }
      );
    }

    const accessToken = await getGoogleAccessToken(organizationId);

    const rawEmail = [
      `From: ${integration.provider_account_email}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
    ].join("\r\n");

    const encodedMessage = Buffer.from(rawEmail)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      }
    );

    const gmail = await gmailResponse.json();

    if (!gmailResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            gmail?.error?.message ??
            `Failed to send Gmail message (${gmailResponse.status})`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      account: integration.provider_account_email,
      message: {
        id: gmail.id,
        threadId: gmail.threadId,
        labelIds: gmail.labelIds ?? [],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? "Failed to send Gmail message.",
      },
      { status: 500 }
    );
  }
}