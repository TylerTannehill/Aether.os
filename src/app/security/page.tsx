"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Lock,
  Users,
  Database,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

const principles = [
  "Secure by Design",
  "Role-Based Access",
  "Campaign Isolation",
  "Transparent Practices",
];

const roles = [
  {
    title: "Admin",
    description: "Complete campaign management and organization administration.",
  },
  {
    title: "Director",
    description: "Department management, oversight, and execution.",
  },
  {
    title: "General User",
    description: "Assigned operational responsibilities with appropriate permissions.",
  },
];

export default function SecurityPage() {
  const [form,setForm]=useState({name:"",email:"",organization:"",phone:"",message:""});
  const [sending,setSending]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState("");

  function handleChange(e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) {
    const {name,value}=e.target;
    setForm(f=>({...f,[name]:value}));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    try{
      const res=await fetch("/api/contact",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({type:"security",...form})
      });
      const data=await res.json();
      if(!res.ok||!data.success) throw new Error();
      setSubmitted(true);
    }catch{
      setError("Unable to send your report. Please try again.");
    }finally{
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <section className="relative px-6 py-8 lg:px-10">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute left-[-12rem] top-[-14rem] h-[32rem] w-[32rem] rounded-full bg-violet-700/30 blur-3xl" />
          <div className="absolute right-[-12rem] top-[22rem] h-[34rem] w-[34rem] rounded-full bg-blue-700/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Landing Page
          </Link>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">
              Security
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight lg:text-7xl">
              Protecting Campaign Data Through Secure Infrastructure,
              Transparent Practices, and Role-Based Access.
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
              Campaigns trust Aether with operational information every day. We
              believe that trust is earned through secure design, transparent
              practices, and clear communication—not exaggerated claims or
              marketing buzzwords.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {principles.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
              <Database className="h-10 w-10 text-violet-300" />
              <h2 className="mt-5 text-3xl font-black">Campaign Isolation</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Every campaign operates inside its own organization. Campaign
                data is isolated and cannot be accessed by other organizations
                using Aether.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
              <KeyRound className="h-10 w-10 text-violet-300" />
              <h2 className="mt-5 text-3xl font-black">Authentication</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Secure authentication protects every account. Access requires an
                authenticated user account, and passwords are securely managed
                through modern identity services.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 lg:p-10">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-violet-300" />
              <h2 className="text-4xl font-black">Role-Based Access</h2>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {roles.map((role) => (
                <div key={role.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
                  <h3 className="text-2xl font-black">{role.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{role.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
              <Lock className="h-10 w-10 text-violet-300" />
              <h2 className="mt-5 text-3xl font-black">Encryption</h2>
              <p className="mt-4 leading-8 text-slate-300">
                All communication between your browser, mobile device, and
                Aether is encrypted in transit using modern industry-standard
                security protocols.
              </p>
            </div>

            <div className="rounded-[2rem] border border-violet-300/20 bg-[#efe7ff] p-8 text-[#32106b]">
              <Shield className="h-10 w-10" />
              <h2 className="mt-5 text-3xl font-black">
                Your campaign owns your campaign's data.
              </h2>
              <p className="mt-4 leading-8">
                Aether exists to help campaigns organize, understand, and
                execute—not to claim ownership of the information entrusted to
                the platform.
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
              <KeyRound className="h-10 w-10 text-violet-300" />
              <h2 className="mt-5 text-3xl font-black">Connected Integrations</h2>
              <p className="mt-4 leading-8 text-slate-300">
                When a campaign connects a third-party service to Aether, Aether
                accesses only the information and capabilities authorized through
                that provider connection and uses that access to provide the
                integration features requested by the campaign.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Connected services remain subject to the permissions, security
                practices, and policies of their respective providers. Campaign
                leadership controls which supported integrations are connected to
                its Aether organization.
              </p>
            </div>

            <div className="rounded-[2rem] border border-violet-300/20 bg-[#efe7ff] p-8 text-[#32106b]">
              <Database className="h-10 w-10" />
              <h2 className="mt-5 text-3xl font-black">Your Data. Your Exit.</h2>
              <p className="mt-4 leading-8">
                Your campaign data remains your data. Aether provides an easy-to-use
                Full Data Export from inside the platform so campaign leadership can
                retain a copy of campaign-owned operational data.
              </p>
              <p className="mt-4 leading-8">
                Following cancellation or completion of yearly usage, Aether may
                retain campaign data for up to 60 days. We recommend exporting your
                full data set before that grace period expires.
              </p>
              <p className="mt-4 leading-8">
                Campaigns that want to preserve their Aether data between campaign
                cycles may keep their data stored in Aether for $5 per month until
                the next campaign rather than allowing the post-subscription
                retention period to expire.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 lg:p-10">
            <CheckCircle2 className="h-10 w-10 text-violet-300" />
            <h2 className="mt-5 text-4xl font-black">Built on Transparency</h2>
            <p className="mt-6 max-w-4xl leading-8 text-slate-300">
              We won't claim certifications we haven't earned. We won't make
              promises no software can honestly guarantee. As Aether grows,
              we'll continue strengthening security while remaining transparent
              about how the platform protects campaign information.
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 lg:p-10">
            <h2 className="text-4xl font-black">Report a Security Concern</h2>
            <p className="mt-5 max-w-3xl text-slate-300">
              If you've identified a security concern or believe you've found a vulnerability, please let us know. Team Aether reviews every report.
            </p>

            {submitted ? (
              <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-green-200">
                <h3 className="font-bold">Security Report Received</h3>
                <p className="mt-2">Thank you. Team Aether will be in touch.</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <input required name="name" value={form.name} onChange={handleChange} placeholder="Name *" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
              <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email *" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
              <input name="organization" value={form.organization} onChange={handleChange} placeholder="Organization" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Message" rows={5} className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
              {error && <p className="md:col-span-2 text-red-300">{error}</p>}
              <div className="md:col-span-2">
                <button type="submit" disabled={sending} className="cursor-pointer rounded-2xl bg-white px-6 py-4 font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                  {sending?"Sending...":"Submit Security Report"}
                </button>
                <p className="mt-3 text-xs text-slate-400">* Required fields</p>
              </div>
            </form>)}
          </section>
        </div>
      </section>
    </main>
  );
}
