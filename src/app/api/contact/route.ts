import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactType = "demo" | "contact" | "support" | "security" | "module_request";

interface ContactRequest {
  type: ContactType;
  name: string;
  email: string;
  organization?: string;
  phone?: string;
  subject?: string;
  message: string;
}

interface SocialReportRequest {
  type: "social_report";
  postId?: string;
  profileId?: string;
  reason: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const subjectMap = {
  demo: "Demo Request",
  contact: "Contact Request",
  support: "Support Request",
  security: "Security Inquiry",
  module_request: "Business Module Request",
} as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function handleSocialReport(request: NextRequest, body: SocialReportRequest) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonError("Sign in to submit a report.", 401);

  const postId = typeof body.postId === "string" ? body.postId.trim() : "";
  const profileId = typeof body.profileId === "string" ? body.profileId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const isPostReport = Boolean(postId);
  if ((!isPostReport && !profileId) || (postId && profileId) ||
      (isPostReport && !UUID_PATTERN.test(postId)) ||
      (!isPostReport && !UUID_PATTERN.test(profileId)) ||
      !reason || reason.length > 2000) {
    return jsonError("Provide one valid post or profile ID and a reason (up to 2,000 characters).", 400);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Social report: Supabase server configuration is missing.");
    return jsonError("Reporting is temporarily unavailable.", 503);
  }

  const authHeaders = { apikey: supabaseKey, authorization: `Bearer ${token}` };
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: authHeaders,
    cache: "no-store",
  });
  if (!userResponse.ok) return jsonError("Your session has expired. Sign in again.", 401);
  const user = (await userResponse.json()) as { id?: string; email?: string };
  if (!user.id) return jsonError("Could not verify your account.", 401);

  const reporterQuery = new URL(`${supabaseUrl}/rest/v1/social_profiles`);
  reporterQuery.searchParams.set("select", "id,display_name,username");
  reporterQuery.searchParams.set("auth_user_id", `eq.${user.id}`);
  reporterQuery.searchParams.set("limit", "1");

  const targetQuery = new URL(`${supabaseUrl}/rest/v1/${isPostReport ? "social_posts" : "social_profiles"}`);
  targetQuery.searchParams.set("select", isPostReport
    ? "id,author_id,employer_id,context,content,created_at"
    : "id,display_name,username,bio");
  targetQuery.searchParams.set("id", `eq.${isPostReport ? postId : profileId}`);
  targetQuery.searchParams.set("limit", "1");

  const [reporterResponse, targetResponse] = await Promise.all([
    fetch(reporterQuery.toString(), { headers: authHeaders, cache: "no-store" }),
    fetch(targetQuery.toString(), { headers: authHeaders, cache: "no-store" }),
  ]);
  if (!reporterResponse.ok || !targetResponse.ok) {
    return jsonError("Could not verify the reported content. Please try again.", 502);
  }

  const reporters = (await reporterResponse.json()) as Array<{
    id: string; display_name: string | null; username: string | null;
  }>;
  const reporter = reporters[0];
  if (!reporter) return jsonError("Social profile not found.", 403);

  const destination = "team@aetheros.pro";
  const mailBase = {
    from: `"Aether Social" <${process.env.SMTP_USER}>`,
    to: destination,
    ...(user.email ? { replyTo: user.email } : {}),
  };

  if (isPostReport) {
    const reportedPosts = (await targetResponse.json()) as Array<{
      id: string; author_id: string | null; employer_id: string | null;
      context: string; content: string; created_at: string;
    }>;
    const post = reportedPosts[0];
    if (!post) return jsonError("Post not found.", 404);
    if (post.author_id === reporter.id) return jsonError("You cannot report your own post.", 400);

    await transporter.sendMail({
      ...mailBase,
      subject: "Aether Social — Content Report",
      text: [
        "Aether Social — Content Report", "",
        `Reporter: ${reporter.display_name || reporter.username || "Aether member"}`,
        `Reporter profile ID: ${reporter.id}`,
        `Reporter email: ${user.email || "Unavailable"}`,
        `Reported post ID: ${post.id}`,
        `Reported author profile ID: ${post.author_id || "N/A"}`,
        `Reported employer ID: ${post.employer_id || "N/A"}`,
        `Feed: ${post.context}`,
        `Posted: ${post.created_at}`, "",
        "Reason:", reason, "",
        "Post content:", post.content || "[No text — may contain an image]", "",
        "Review promptly; moderation action is not performed by this email endpoint.",
      ].join("\n"),
    });
  } else {
    const reportedProfiles = (await targetResponse.json()) as Array<{
      id: string; display_name: string | null; username: string | null; bio: string | null;
    }>;
    const target = reportedProfiles[0];
    if (!target) return jsonError("Profile not found.", 404);
    if (target.id === reporter.id) return jsonError("You cannot report your own profile.", 400);

    await transporter.sendMail({
      ...mailBase,
      subject: "Aether Social — Profile Report",
      text: [
        "Aether Social — Profile Report", "",
        `Reporter: ${reporter.display_name || reporter.username || "Aether member"}`,
        `Reporter profile ID: ${reporter.id}`,
        `Reporter email: ${user.email || "Unavailable"}`,
        `Reported profile ID: ${target.id}`,
        `Reported name: ${target.display_name || "N/A"}`,
        `Reported username: ${target.username || "N/A"}`, "",
        "Reason:", reason, "",
        "Profile bio:", target.bio || "[No bio]", "",
        "Review promptly; moderation action is not performed by this email endpoint.",
      ].join("\n"),
    });
  }

  return NextResponse.json({ success: true, message: "Report sent to Aether Social support." });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ContactRequest | SocialReportRequest>;
    if (body?.type === "social_report") {
      return await handleSocialReport(request, body as SocialReportRequest);
    }

    const contact = body as ContactRequest;
    if (!contact || !Object.prototype.hasOwnProperty.call(subjectMap, contact.type)) {
      return jsonError("Invalid contact request type.", 400);
    }

    await transporter.sendMail({
      from: `"Aether Website" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: contact.email,
      subject: subjectMap[contact.type],
      text: `
Type: ${subjectMap[contact.type]}

Name: ${contact.name}
Email: ${contact.email}
Organization: ${contact.organization ?? "N/A"}
Phone: ${contact.phone ?? "N/A"}
Subject: ${contact.subject ?? "N/A"}

Message:
${contact.message}
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Contact request received.",
    });
  } catch (error) {
    console.error("Contact API Error:", error);
    return jsonError("Something went wrong.", 500);
  }
}
