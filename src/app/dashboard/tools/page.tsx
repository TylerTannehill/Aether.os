"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  FolderKanban,
  Mail,
  MessageSquare,
  PlugZap,
  Radio,
  Send,
  Sparkles,
  Wrench,
} from "lucide-react";

import { getOrgContextTheme } from "@/lib/org-context-theme";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  id: string;
  org_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
  system?: boolean;
};

type CurrentUser = {
  name: string;
  role: string;
  org_id: string;
  id: string;
};

type OrgMemberRole = {
  department: string;
  role_level: string;
  is_primary?: boolean;
};

type CurrentContextResponse = {
  organization?: {
    id: string;
    name?: string | null;
    slug?: string | null;
    context_mode?: string | null;
  } | null;
  membership?: {
    id: string;
    user_id?: string | null;
    organization_id: string;
    role?: string | null;
    department?: string | null;
    title?: string | null;
  } | null;
  roles?: OrgMemberRole[];
  error?: string;
};

type UtilityModuleId = "calendar" | "drive" | "gmail";

type UtilityModule = {
  id: UtilityModuleId;
  title: string;
  eyebrow: string;
  description: string;
  icon: any;
  status: string;
  items: {
    label: string;
    value: string;
    helper: string;
  }[];
};


const FOUNDER_TRIGGER = "its all about the loops";

const FOUNDER_MESSAGE = `Message received.

From: Tyler Tannehill
Date: June 1, 2026

The LLC was filed with the state today. Aether Systems is officially open for business.

Whether this vision succeeds or fails, remember this:

When life gives you lemons, be bold enough to throw them away. Apple juice is far superior, and we do not settle.

This was built on a dream, a couple hundred bucks, a laptop with a missing S key, and everything going wrong at once.

Remember what you are capable of when everything goes to hell.

And do not be afraid to kick down a few doors in the process.

— Tyler`;

const utilityModules: UtilityModule[] = [
  {
    id: "calendar",
    title: "Calendar",
    eyebrow: "Scheduling Utility",
    description:
      "Shared calendar context for events, deadlines, launches, fundraisers, and operational timing.",
    icon: CalendarDays,
    status: "Ready for Google wiring",
    items: [
      {
        label: "Campaign events",
        value: "Staged",
        helper: "Future synced events, deadlines, and campaign moments.",
      },
      {
        label: "Operational timing",
        value: "Planned",
        helper: "Field launches, print drops, digital launches, and finance calls.",
      },
      {
        label: "Team visibility",
        value: "Team-first",
        helper: "Built around the campaign calendar, not personal customization.",
      },
    ],
  },
  {
    id: "drive",
    title: "Drive",
    eyebrow: "Document Workspace",
    description:
      "Campaign document access powered by Google Drive while Aether remains the operating layer.",
    icon: FolderKanban,
    status: "Ready for Google wiring",
    items: [
      {
        label: "Pinned assets",
        value: "Staged",
        helper: "Messaging docs, proofs, decks, donor sheets, and field packets.",
      },
      {
        label: "Shared folders",
        value: "Planned",
        helper: "Creative, finance, print, field, and campaign-wide folders.",
      },
      {
        label: "Aether context",
        value: "OS-led",
        helper: "Drive stores files; Aether routes the work around them.",
      },
    ],
  },
  {
    id: "gmail",
    title: "Email",
    eyebrow: "Campaign Inbox",
    description:
      "Shared campaign email utility for outgoing campaign communication and team-visible inbox context.",
    icon: Mail,
    status: "Ready for Google wiring",
    items: [
      {
        label: "Shared inbox",
        value: "Staged",
        helper: "Future team visibility into the campaign email account.",
      },
      {
        label: "Outgoing email",
        value: "Planned",
        helper: "One campaign identity like info@campaign.com, not user-by-user chaos.",
      },
      {
        label: "Templates",
        value: "Planned",
        helper: "Future reusable outreach, finance, and coordination templates.",
      },
    ],
  },
];

function normalizeRoleLevel(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function roleImpliesIntegrationsAccess(
  role?: string | null,
  title?: string | null
) {
  const combined = `${role || ""} ${title || ""}`.toLowerCase();

  return (
    combined.includes("admin") ||
    combined.includes("director") ||
    combined.includes("campaign manager") ||
    combined.includes("campaign_manager") ||
    combined.includes("cm")
  );
}

function roleListAllowsIntegrationsAccess(roles: OrgMemberRole[]) {
  return roles.some((role) => {
    const level = normalizeRoleLevel(role.role_level);
    const department = normalizeRoleLevel(role.department);

    return (
      level === "admin" ||
      level === "director" ||
      level === "campaign_manager" ||
      department === "admin" ||
      department === "campaign_manager"
    );
  });
}

export default function ToolsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMode, setContextMode] = useState("default");
  const [organizationName, setOrganizationName] = useState("Active campaign");
  const [canAccessIntegrations, setCanAccessIntegrations] = useState(false);
  const [openModules, setOpenModules] = useState<Record<UtilityModuleId, boolean>>({
    calendar: false,
    drive: false,
    gmail: false,
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function loadMessages(orgId: string) {
    const { data, error } = await supabase
      .from("org_messages")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Failed to load org messages:", error);
      return;
    }

    setMessages((data || []) as Message[]);
  }

  async function loadToolsContext() {
    try {
      const response = await fetch("/api/auth/current-context", {
        method: "GET",
      });

      const data = (await response.json()) as CurrentContextResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to load workspace context.");
      }

      const membership = data.membership;
      const organization = data.organization;
      const roles = data.roles || [];

      if (!membership?.organization_id) {
        setLoading(false);
        return;
      }

      setContextMode(organization?.context_mode || "default");
      setOrganizationName(organization?.name || "Active campaign");

      const nextUser: CurrentUser = {
        name: membership.title || membership.role || "User",
        role: membership.role || "User",
        org_id: membership.organization_id,
        id: membership.id,
      };

      setUser(nextUser);

      setCanAccessIntegrations(
        roleImpliesIntegrationsAccess(membership.role, membership.title) ||
          roleListAllowsIntegrationsAccess(roles)
      );

      await loadMessages(nextUser.org_id);
    } catch (error) {
      console.error("Failed to load tools context:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !user) return;

    const messageText = input.trim();
    const normalizedMessage = messageText.trim().toLowerCase();
    setInput("");

    if (normalizedMessage === FOUNDER_TRIGGER) {
      setMessages((prev) => [
        ...prev,
        {
          id: `founder-${Date.now()}`,
          org_id: user.org_id,
          sender_id: "founder",
          sender_name: "Founder Message",
          sender_role: "System",
          message: FOUNDER_MESSAGE,
          created_at: new Date().toISOString(),
          system: true,
        },
      ]);

      return;
    }

    const { error } = await supabase.from("org_messages").insert({
      org_id: user.org_id,
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      message: messageText,
    });

    if (error) {
      console.error("Failed to send message:", error);
      alert("Message failed to send.");
    }
  }

  function injectAbeSignal(text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `abe-${Date.now()}`,
        org_id: user?.org_id || "unknown",
        sender_id: "abe",
        sender_name: "ABE",
        sender_role: "System",
        message: text,
        created_at: new Date().toISOString(),
        system: true,
      },
    ]);
  }

  function toggleModule(moduleId: UtilityModuleId) {
    setOpenModules((current) => ({
      ...current,
      [moduleId]: !current[moduleId],
    }));
  }

  useEffect(() => {
    loadToolsContext();
  }, []);

  useEffect(() => {
    if (!user?.org_id) return;

    const channel = supabase
      .channel(`realtime:org_messages:${user.org_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "org_messages",
          filter: `org_id=eq.${user.org_id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          setMessages((prev) => [...prev, newMessage]);

          if (newMessage.message.toLowerCase().includes("donor")) {
            injectAbeSignal(
              "ABE: Finance pressure increasing — review donor follow-ups."
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.org_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const orgTheme = getOrgContextTheme(contextMode);

  const toolsStatusText = useMemo(() => {
    if (canAccessIntegrations) {
      return "Workspace utilities plus infrastructure access";
    }

    return "Workspace utilities and campaign coordination";
  }, [canAccessIntegrations]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading tools workspace...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No active campaign found. Please log out and log back in with a campaign.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section
        className={`rounded-3xl border border-slate-800 bg-gradient-to-br p-6 text-white shadow-sm transition-colors duration-300 lg:p-8 ${orgTheme.heroGradient}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Wrench className="h-3.5 w-3.5" />
              Tools Workspace
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Campaign coordination and utility shelf.
              </h1>

              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                Tools is where the campaign coordinates, checks shared workspace
                utilities, and reaches infrastructure when the role allows it.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              <Activity className="h-3.5 w-3.5" />
              {organizationName} • {toolsStatusText}
            </div>
          </div>

          {canAccessIntegrations ? (
            <Link
              href="/dashboard/integrations"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <PlugZap className="h-4 w-4" />
              Open Integrations Hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </section>

      {canAccessIntegrations ? (
        <section className="hidden">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
                <PlugZap className="h-3.5 w-3.5" />
                Infrastructure Access
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                Infrastructure access available
              </h2>

              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                External signal pathways, ingestion testing, and integration
                management remain available for admins, campaign managers,
                and directors.
              </p>
            </div>

            <Link
              href="/dashboard/integrations"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Open Integrations Hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
        <div
          className={`border-b border-slate-800 bg-gradient-to-br px-6 py-5 text-white ${orgTheme.heroGradient}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <Radio className="h-3.5 w-3.5" />
                Internal coordination lane
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Campaign Coordination
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  Lightweight operational messaging across your active campaign.
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 lg:flex">
              <Activity className="h-4 w-4 text-emerald-400" />

              <div className="text-xs">
                <div className="font-medium text-white">
                  Coordination Active
                </div>
                <div className="text-slate-400">
                  Live org messaging enabled
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
              {user.role}
            </div>

            <div className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-fuchsia-700">
              ABE aware
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
              Live coordination
            </div>

            <div
              className={`rounded-full border px-3 py-1 ${orgTheme.accentBorder} ${orgTheme.accentSoftBg} ${orgTheme.accentText}`}
            >
              {orgTheme.label} context
            </div>
          </div>
        </div>

        <div className="h-[44vh] overflow-y-auto bg-slate-100/60 px-5 py-5">
          <div className="mx-auto flex max-w-5xl flex-col gap-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                No messages yet. Start the campaign coordination thread below.
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  message.system
                    ? "border-fuchsia-200 bg-fuchsia-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  {message.system ? (
                    <Sparkles className="h-4 w-4 text-fuchsia-600" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                  )}

                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    {message.sender_name} • {message.sender_role}
                  </div>
                </div>

                <div
                  className={`text-sm leading-6 ${
                    message.system ? "text-fuchsia-950" : "text-slate-800"
                  }`}
                >
                  {message.message}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <div className="mx-auto flex max-w-5xl gap-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              placeholder="Coordinate with your campaign team..."
            />

            <button
              onClick={sendMessage}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {utilityModules.map((module) => {
          const Icon = module.icon;
          const isOpen = openModules[module.id];

          return (
            <div
              key={module.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                className="flex w-full flex-col gap-4 px-5 py-5 text-left transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-2xl border p-3 ${orgTheme.accentBorder} ${orgTheme.accentSoftBg}`}
                  >
                    <Icon className={`h-5 w-5 ${orgTheme.accentText}`} />
                  </div>

                  <div>
                    <div
                      className={`text-xs font-semibold uppercase tracking-[0.16em] ${orgTheme.accentText}`}
                    >
                      {module.eyebrow}
                    </div>

                    <h3 className="mt-1 text-xl font-semibold text-slate-950">
                      {module.title}
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                      {module.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {module.status}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 text-slate-500 transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {isOpen ? (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    {module.items.map((item) => (
                      <div
                        key={`${module.id}-${item.label}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {item.label}
                        </p>

                        <p className="mt-2 text-lg font-semibold text-slate-950">
                          {item.value}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.helper}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">
                    Google connection controls will live here once we wire the
                    selected utility. For now, this module defines the campaign
                    workspace shape without pretending the live connector exists.
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              {messages.length} coordination messages
            </span>

            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              {utilityModules.length} utility modules staged
            </span>

            <span className={`inline-flex items-center gap-2 ${orgTheme.accentText}`}>
              <Wrench className="h-4 w-4" />
              {canAccessIntegrations ? "Infrastructure access enabled" : "Tools only"}
            </span>
          </div>

          {canAccessIntegrations ? (
            <Link
              href="/dashboard/integrations"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
            >
              Integrations hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
