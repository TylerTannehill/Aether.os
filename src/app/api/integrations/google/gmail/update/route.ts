import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/integrations/google/get-google-access-token";

export async function POST(request: NextRequest) {
  try {
    const {
      organizationId,
      messageId,
      action,
      labelId,
    } = await request.json();

    if (!organizationId || !messageId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields.",
        },
        { status: 400 }
      );
    }

    const { data: integration } = await supabaseAdmin
      .from("organization_integrations")
      .select("status")
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

    let body: any = {};

    switch (action) {
      case "markRead":
        body.removeLabelIds = ["UNREAD"];
        break;

      case "markUnread":
        body.addLabelIds = ["UNREAD"];
        break;

      case "star":
        body.addLabelIds = ["STARRED"];
        break;

      case "unstar":
        body.removeLabelIds = ["STARRED"];
        break;

      case "archive":
        body.removeLabelIds = ["INBOX"];
        break;

      case "moveToInbox":
        body.addLabelIds = ["INBOX"];
        break;

      case "trash":
        {
          const response = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!response.ok) {
            const error = await response.json();

            return NextResponse.json(
              {
                success: false,
                error:
                  error?.error?.message ??
                  "Failed to trash message.",
              },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            action,
          });
        }

      case "addLabel":
        body.addLabelIds = [labelId];
        break;

      case "removeLabel":
        body.removeLabelIds = [labelId];
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Unsupported action.",
          },
          { status: 400 }
        );
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const gmail = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            gmail?.error?.message ??
            "Failed to update Gmail message.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      labelIds: gmail.labelIds ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ??
          "Failed to update Gmail message.",
      },
      { status: 500 }
    );
  }
}