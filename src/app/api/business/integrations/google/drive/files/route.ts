import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/integrations/google/get-google-access-token";

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId");
    const folderId = request.nextUrl.searchParams.get("folderId") || "root";
    const pageToken = request.nextUrl.searchParams.get("pageToken") || "";

    if (!organizationId) {
      return NextResponse.json(
        { success: false, files: [], error: "Missing organizationId." },
        { status: 400 }
      );
    }

    const accessToken = await getGoogleAccessToken(organizationId);

    const query = [
      `'${folderId.replace(/'/g, "\\'")}' in parents`,
      "trashed = false",
    ].join(" and ");

    const params = new URLSearchParams({
      q: query,
      pageSize: "100",
      orderBy: "folder,name",
      spaces: "drive",
      fields:
        "nextPageToken,files(id,name,mimeType,modifiedTime,createdTime,size,webViewLink,iconLink,thumbnailLink,parents,owners(displayName,emailAddress),shared,starred,description,fileExtension)",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const google = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          files: [],
          error:
            google?.error?.message ||
            `Failed to load Google Drive files (${response.status})`,
        },
        { status: response.status }
      );
    }

    const files = (google.files ?? []).map((file: any) => ({
      id: file.id,
      name: file.name ?? "",
      mimeType: file.mimeType ?? "",
      isFolder: file.mimeType === "application/vnd.google-apps.folder",
      modifiedTime: file.modifiedTime ?? null,
      createdTime: file.createdTime ?? null,
      size: file.size ? Number(file.size) : null,
      webViewLink: file.webViewLink ?? "",
      iconLink: file.iconLink ?? "",
      thumbnailLink: file.thumbnailLink ?? "",
      parents: file.parents ?? [],
      owners:
        file.owners?.map((owner: any) => ({
          name: owner.displayName ?? "",
          email: owner.emailAddress ?? "",
        })) ?? [],
      shared: Boolean(file.shared),
      starred: Boolean(file.starred),
      description: file.description ?? "",
      extension: file.fileExtension ?? "",
    }));

    return NextResponse.json({
      success: true,
      folderId,
      files,
      nextPageToken: google.nextPageToken ?? null,
    });
  } catch (error: any) {
    console.error("Google Drive files route error:", error);

    return NextResponse.json(
      {
        success: false,
        files: [],
        error: error?.message || "Failed to load Google Drive files.",
      },
      { status: 500 }
    );
  }
}
