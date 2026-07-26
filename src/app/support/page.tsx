"use client";

import { useState } from "react";
import Link from "next/link";

export default function SupportPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "support",
          ...form,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed");
      }

      setSuccess(
        "Support Request Received. Thank you. Team Aether has received your request and will be in touch as soon as possible."
      );

      setForm({
        name: "",
        email: "",
        organization: "",
        phone: "",
        message: "",
      });
    } catch {
      setError("Unable to send your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111F] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(7,17,31,0.35),transparent)]" />

      <div className="relative mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10"
        >
          <span>←</span>
          <span>Back to Landing Page</span>
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl">
          <h1 className="text-5xl font-black tracking-tight">Support</h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            We're sorry you're experiencing trouble with Aether.
          </p>

          <p className="mt-6 leading-8 text-slate-300">
            Campaigns rely on Aether during long days and critical moments, and
            we understand how important it is for the platform to work
            reliably. While issues can occasionally happen, Team Aether is
            committed to resolving them as quickly as possible.
          </p>

          <p className="mt-6 leading-8 text-slate-300">
            Before reaching out, you may find the answer you're looking for in
            Aether Academy, where we maintain documentation, walkthroughs, and
            platform guides.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/aether-academy"
              className="rounded-xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-500"
            >
              Visit Aether Academy
            </Link>
          </div>

          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-3xl font-bold">Need Additional Help?</h2>

            <p className="mt-4 text-slate-300">
              If you weren't able to resolve your issue, send Team Aether a
              support request below.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
              <input
                name="name"
                placeholder="Name *"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-slate-400"
              />

              <input
                name="email"
                type="email"
                placeholder="Email *"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-slate-400"
              />

              <input
                name="organization"
                placeholder="Organization"
                value={form.organization}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-slate-400"
              />

              <input
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-slate-400"
              />

              <textarea
                name="message"
                rows={6}
                placeholder="Message *"
                required
                value={form.message}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-slate-400"
              />

              {success && (
                <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-green-300">
                  {success}
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-violet-600 px-6 py-4 font-bold text-white transition hover:bg-violet-500 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Support Request"}
              </button>
            </form>

            <div className="mt-16 border-t border-white/10 pt-12 text-center">
              <h3 className="text-2xl font-bold">
                Need to get back to work?
              </h3>

              <p className="mt-4 text-slate-300">
                Return to your campaign workspace.
              </p>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/login"
                  className="inline-flex w-full max-w-md items-center justify-center rounded-xl bg-violet-600 px-8 py-4 font-bold text-white transition hover:bg-violet-500"
                >
                  Enter Aether
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}