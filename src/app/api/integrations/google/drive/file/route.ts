import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/integrations/google/get-google-access-token";

const GOOGLE_FOLDER = "application/vnd.google-apps.folder";
const GOOGLE_DOC = "application/vnd.google-apps.document";
const GOOGLE_SHEET = "application/vnd.google-apps.spreadsheet";
const GOOGLE_SLIDES = "application/vnd.google-apps.presentation";

function readableMimeType(mimeType: string) {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/javascript" ||
    mimeType === "application/x-javascript"
  );
}

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId");
    const fileId = request.nextUrl.searchParams.get("fileId");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, file: null, error: "Missing organizationId." },
        { status: 400 }
      );
    }

    if (!fileId) {
      return NextResponse.json(
        { success: false, file: null, error: "Missing fileId." },
        { status: 400 }
      );
    }

    const accessToken = await getGoogleAccessToken(organizationId);

    const metadataParams = new URLSearchParams({
      fields:
        "id,name,mimeType,modifiedTime,createdTime,size,webViewLink,iconLink,thumbnailLink,parents,owners(displayName,emailAddress),shared,starred,description,fileExtension",
    });

    const metadataResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}?${metadataParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const metadata = await metadataResponse.json();

    if (!metadataResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          file: null,
          error:
            metadata?.error?.message ||
            `Failed to load Google Drive file (${metadataResponse.status})`,
        },
        { status: metadataResponse.status }
      );
    }

    const baseFile = {
      id: metadata.id,
      name: metadata.name ?? "",
      mimeType: metadata.mimeType ?? "",
      modifiedTime: metadata.modifiedTime ?? null,
      createdTime: metadata.createdTime ?? null,
      size: metadata.size ? Number(metadata.size) : null,
      webViewLink: metadata.webViewLink ?? "",
      iconLink: metadata.iconLink ?? "",
      thumbnailLink: metadata.thumbnailLink ?? "",
      parents: metadata.parents ?? [],
      owners:
        metadata.owners?.map((owner: any) => ({
          name: owner.displayName ?? "",
          email: owner.emailAddress ?? "",
        })) ?? [],
      shared: Boolean(metadata.shared),
      starred: Boolean(metadata.starred),
      description: metadata.description ?? "",
      extension: metadata.fileExtension ?? "",
    };

    if (metadata.mimeType === GOOGLE_FOLDER) {
      return NextResponse.json({
        success: true,
        file: {
          ...baseFile,
          isFolder: true,
          readable: false,
          contentType: "folder",
          content: null,
        },
      });
    }

    let contentResponse: Response | null = null;
    let contentType = "";
    let readable = false;

    if (metadata.mimeType === GOOGLE_DOC) {
      contentType = "text/plain";
      readable = true;
      contentResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId
        )}/export?mimeType=${encodeURIComponent("text/plain")}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }
      );
    } else if (metadata.mimeType === GOOGLE_SHEET) {
      contentType = "text/csv";
      readable = true;
      contentResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId
        )}/export?mimeType=${encodeURIComponent("text/csv")}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }
      );
    } else if (metadata.mimeType === GOOGLE_SLIDES) {
      contentType = "text/plain";
      readable = true;
      contentResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId
        )}/export?mimeType=${encodeURIComponent("text/plain")}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }
      );
    } else if (readableMimeType(metadata.mimeType || "")) {
      contentType = metadata.mimeType;
      readable = true;
      contentResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId
        )}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }
      );
    }

    if (!contentResponse) {
      return NextResponse.json({
        success: true,
        file: {
          ...baseFile,
          isFolder: false,
          readable: false,
          contentType: metadata.mimeType ?? "",
          content: null,
        },
      });
    }

    if (!contentResponse.ok) {
      let googleError = "";
      try {
        const errorData = await contentResponse.json();
        googleError = errorData?.error?.message || "";
      } catch {
        googleError = "";
      }

      return NextResponse.json(
        {
          success: false,
          file: null,
          error:
            googleError ||
            `Failed to read Google Drive file (${contentResponse.status})`,
        },
        { status: contentResponse.status }
      );
    }

    const content = await contentResponse.text();

    return NextResponse.json({
      success: true,
      file: {
        ...baseFile,
        isFolder: false,
        readable,
        contentType,
        content,
      },
    });
  } catch (error: any) {
    console.error("Google Drive file route error:", error);

    return NextResponse.json(
      {
        success: false,
        file: null,
        error: error?.message || "Failed to read Google Drive file.",
      },
      { status: 500 }
    );
  }
}
