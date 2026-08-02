import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sales_campaigns")
    .select("*")
    .order("campaign", { ascending: true });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    campaigns: data,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { campaigns } = await request.json();

  const { error } = await supabase
    .from("sales_campaigns")
    .insert(campaigns);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    imported: campaigns.length,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const { id, updates } = await request.json();

  if (!id || !updates || typeof updates !== "object") {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid update payload.",
      },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("sales_campaigns")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}
