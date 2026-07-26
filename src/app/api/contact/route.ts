import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface ContactRequest {
  type: "demo" | "contact" | "support" | "security";
  name: string;
  email: string;
  organization?: string;
  phone?: string;
  subject?: string;
  message: string;
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
} as const;

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequest = await request.json();

    await transporter.sendMail({
      from: `"Aether Website" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: body.email,
      subject: subjectMap[body.type],
      text: `
Type: ${subjectMap[body.type]}

Name: ${body.name}
Email: ${body.email}
Organization: ${body.organization ?? "N/A"}
Phone: ${body.phone ?? "N/A"}
Subject: ${body.subject ?? "N/A"}

Message:
${body.message}
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Contact request received.",
    });
  } catch (error) {
    console.error("Contact API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}