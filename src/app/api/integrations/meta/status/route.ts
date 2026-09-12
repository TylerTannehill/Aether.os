import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const META_GRAPH_VERSION = "v23.0";
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

async function metaGet(
  path: string,
  accessToken: string,
  params: Record<string, string> = {}
) {
  const url = new URL(`${META_GRAPH_BASE}/${path.replace(/^\/+/, "")}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok || payload?.error) {
    throw new Error(
      payload?.error?.message ||
        `Meta Graph API request failed with status ${response.status}.`
    );
  }

  return payload;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const organizationId =
      cookieStore.get("active_organization_id")?.value?.trim();

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          provider: "meta",
          error: "No active campaign selected.",
        },
        { status: 400 }
      );
    }

    const { data: connection, error } = await supabaseAdmin
      .from("organization_integrations")
      .select(
        "id, organization_id, provider, status, scopes, expires_at, metadata, access_token, created_at, updated_at"
      )
      .eq("organization_id", organizationId)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) {
      console.error("[META STATUS] Lookup failed", error);

      return NextResponse.json(
        {
          success: false,
          connected: false,
          provider: "meta",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const connected = Boolean(
      connection && connection.status === "connected"
    );

    const metadata =
      connection?.metadata &&
      typeof connection.metadata === "object" &&
      !Array.isArray(connection.metadata)
        ? (connection.metadata as Record<string, unknown>)
        : {};

    const diagnostic: {
      tokenPresent: boolean;
      metaUser?: {
        id: string | null;
        name: string | null;
      };
      managedPages?: Array<{
        id: string;
        name: string | null;
        pageAccessTokenPresent: boolean;
        instagramBusinessAccountId: string | null;
        recentPostCount: number | null;
        recentPosts: Array<{
          id: string;
          createdTime: string | null;
          messagePreview: string | null;
        }>;
        postsError: string | null;
      }>;
      error?: string;
    } = {
      tokenPresent: Boolean(connection?.access_token),
    };

    if (connected && connection?.access_token) {
      try {
        const token = connection.access_token.trim();

        const [mePayload, pagesPayload] = await Promise.all([
          metaGet("me", token, { fields: "id,name" }),
          metaGet("me/accounts", token, {
            fields: "id,name,access_token,instagram_business_account",
            limit: "100",
          }),
        ]);

        diagnostic.metaUser = {
          id: mePayload?.id ?? null,
          name: mePayload?.name ?? null,
        };

        const pages = Array.isArray(pagesPayload?.data)
          ? pagesPayload.data
          : [];

        diagnostic.managedPages = [];

        for (const page of pages) {
          const pageToken =
            typeof page?.access_token === "string"
              ? page.access_token.trim()
              : "";

          let recentPostCount: number | null = null;
          let recentPosts: Array<{
            id: string;
            createdTime: string | null;
            messagePreview: string | null;
          }> = [];
          let postsError: string | null = null;

          if (page?.id && pageToken) {
            try {
              const postsPayload = await metaGet(
                `${page.id}/posts`,
                pageToken,
                {
                  fields: "id,message,created_time",
                  limit: "10",
                }
              );

              const posts = Array.isArray(postsPayload?.data)
                ? postsPayload.data
                : [];

              recentPostCount = posts.length;
              recentPosts = posts.map((post: any) => ({
                id: String(post?.id ?? ""),
                createdTime: post?.created_time ?? null,
                messagePreview:
                  typeof post?.message === "string"
                    ? post.message.slice(0, 120)
                    : null,
              }));
            } catch (postError: any) {
              postsError =
                postError?.message || "Failed to read Facebook Page posts.";
            }
          }

          diagnostic.managedPages.push({
            id: String(page?.id ?? ""),
            name: page?.name ?? null,
            pageAccessTokenPresent: Boolean(pageToken),
            instagramBusinessAccountId:
              page?.instagram_business_account?.id ?? null,
            recentPostCount,
            recentPosts,
            postsError,
          });
        }
      } catch (diagnosticError: any) {
        diagnostic.error =
          diagnosticError?.message || "Meta diagnostic failed.";
      }
    }

    return NextResponse.json(
      {
        success: true,
        connected,
        provider: "meta",
        organizationId,
        status: connection?.status ?? "disconnected",
        account: connected
          ? {
              id: metadata.meta_user_id ?? null,
              name: metadata.name ?? null,
            }
          : null,
        scopes: connection?.scopes ?? [],
        expiresAt: connection?.expires_at ?? null,
        updatedAt: connection?.updated_at ?? null,
        diagnostic,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("[META STATUS] Failed", error);

    return NextResponse.json(
      {
        success: false,
        connected: false,
        provider: "meta",
        error: error?.message || "Failed to read Meta connection status.",
      },
      { status: 500 }
    );
  }
}
