"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";

export default function ExploreAbePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    phone: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "demo",
          name: form.name,
          email: form.email,
          organization: form.organization,
          phone: form.phone,
          message: form.message,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to submit demo request.");
      }

      setSubmitted(true);
    } catch (submitError) {
      console.error("Demo request error:", submitError);
      setError("Unable to send your request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-8 lg:px-[18px] lg:py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:gap-6">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 lg:px-3 lg:py-2.5 lg:text-[12px] lg:rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
          Back to Landing Page
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.8fr]">
            <div className="p-8 lg:p-9 lg:p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200 lg:px-3 lg:py-1.5 lg:text-[10px]">
                <Sparkles className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Explore Abe
              </div>

              <h1 className="mt-8 max-w-3xl text-4xl font-black tracking-tight text-white lg:text-5xl lg:mt-6 lg:text-3xl">
                Request a demo of Aether Political.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 lg:text-sm lg:leading-6 lg:text-base lg:mt-4 lg:text-sm">
                Thank you for your interest in Aether. Tell us a little about
                your campaign and what you're hoping to accomplish. Team Aether
                will reach out as demo scheduling becomes available, and we're
                looking forward to showing you how Aether can help simplify your
                campaign operations.
              </p>
            </div>

            <div className="border-t border-white/10 bg-white/[0.03] p-8 lg:border-l lg:border-t-0 lg:p-7 lg:p-6">
              <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl lg:p-[18px] lg:rounded-2xl">
                <div className="flex items-center gap-3 lg:gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white lg:h-10 lg:w-10 lg:rounded-xl">
                    <Mail className="h-5 w-5 lg:h-4 lg:w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold lg:text-base">Request an Aether Demo</p>
                    <p className="text-sm text-slate-500 lg:text-[12px]">
                      Tell us a little about your campaign.
                    </p>
                  </div>
                </div>

                {submitted ? (
                  <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800 lg:p-4 lg:mt-4 lg:rounded-xl">
                    <h2 className="font-bold">Demo Request Received</h2>
                    <p className="mt-2 text-sm lg:mt-1.5 lg:text-[12px]">
                      Thank you. Team Aether will be in touch.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4 lg:space-y-3 lg:mt-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[10px]"
                      >
                        Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 lg:px-3 lg:py-2.5 lg:mt-1.5 lg:text-[12px] lg:rounded-xl"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[10px]"
                      >
                        Email *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 lg:px-3 lg:py-2.5 lg:mt-1.5 lg:text-[12px] lg:rounded-xl"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="organization"
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[10px]"
                      >
                        Campaign / Organization
                      </label>
                      <input
                        id="organization"
                        name="organization"
                        type="text"
                        value={form.organization}
                        onChange={handleChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 lg:px-3 lg:py-2.5 lg:mt-1.5 lg:text-[12px] lg:rounded-xl"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[10px]"
                      >
                        Phone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 lg:px-3 lg:py-2.5 lg:mt-1.5 lg:text-[12px] lg:rounded-xl"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[10px]"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={form.message}
                        onChange={handleChange}
                        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 lg:px-3 lg:py-2.5 lg:mt-1.5 lg:text-[12px] lg:rounded-xl"
                      />
                    </div>

                    {error ? (
                      <p className="text-sm font-medium text-red-600 lg:text-[12px]">{error}</p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 lg:px-4 lg:py-3 lg:text-[12px] lg:rounded-xl"
                    >
                      {sending ? "Sending..." : "Request Demo"}
                    </button>

                    <p className="text-xs text-slate-500 lg:text-[10px]">* Required fields</p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
