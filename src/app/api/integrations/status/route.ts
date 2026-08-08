import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
    try {
        const supabase = supabaseAdmin;

        const {
            data: { user },
        } = await supabase.auth.getUser();

        console.log("[STATUS] Auth User:", user?.id);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        const cookieStore = await cookies();

        const activeOrganizationId =
            cookieStore.get("active_organization_id")?.value ?? null;

        if (!activeOrganizationId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No active organization selected",
                },
                {
                    status: 400,
                }
            );
        }

        const { data: integrations, error } = await supabase
            .from("organization_integrations")
            .select("*")
            .eq("organization_id", activeOrganizationId);



        console.log("[STATUS] Active Org:", activeOrganizationId);
        console.log("[STATUS] Query Error:", error);
        console.log("[STATUS] Query Result:", integrations);

        if (error) {
            throw error;
        }

        const connectedProviders = new Set(
            (integrations ?? [])
                .filter((x: any) => x.status === "connected")
                .map((x: any) => x.provider)
        );

        return NextResponse.json({
            success: true,
            organizationId: activeOrganizationId,

            connected: {
                google: connectedProviders.has("google"),
                meta: connectedProviders.has("meta"),
                x: connectedProviders.has("x"),
                youtube: connectedProviders.has("youtube"),
                tiktok: connectedProviders.has("tiktok"),
                actblue: connectedProviders.has("actblue"),
                winred: connectedProviders.has("winred"),
            },

            integrations,
        });
    } catch (error) {
        console.error("[Integration Status]", error);

        return NextResponse.json(
            {
                success: false,
                error: "Unable to load integrations.",
            },
            {
                status: 500,
            }
        );
    }
}
