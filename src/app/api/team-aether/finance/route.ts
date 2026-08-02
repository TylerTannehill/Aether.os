import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET
export async function GET() {
    try {
        const { data, error } = await supabase
            .from("team_aether_finance")
            .select("*")
            .order("due_date", { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { data, error } = await supabase
            .from("team_aether_finance")
            .insert([
                {
                    name: body.name,
                    due_date: body.due_date,
                    amount: body.amount,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// PATCH
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();

        const { id, ...updates } = body;

        const { data, error } = await supabase
            .from("team_aether_finance")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// DELETE
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();

        const { error } = await supabase
            .from("team_aether_finance")
            .delete()
            .eq("id", body.id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}