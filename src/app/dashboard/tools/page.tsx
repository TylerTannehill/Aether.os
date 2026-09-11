"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  FolderKanban,
  Mail,
  MessageSquare,
  PlugZap,
  Radio,
  Send,
  Sparkles,
  Users,
  Wrench,
  X,
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

type TeamStatusMember = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  title: string | null;
  profile_status: string;
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

const ROBBY_TRIGGER = "12345678";

const ROBBY_MESSAGE = `Message received.

From: Robby Patel
Date: June 4, 2026

Who do we appreciate?`;

const MIKE_TRIGGER = "where is mike";

const MIKE_MESSAGE = `Message received.

8/31 - Mike decided that a founder message was less important than spending time with his honey boo boo and a short king... tsk tsk Mike. -Tyler`;

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
  const [teamStatusOpen, setTeamStatusOpen] = useState(false);
  const [teamStatusLoading, setTeamStatusLoading] = useState(false);
  const [teamStatusError, setTeamStatusError] = useState<string | null>(null);
  const [teamStatusMembers, setTeamStatusMembers] = useState<TeamStatusMember[]>([]);
const [gmailMessages, setGmailMessages] = useState<any[]>([]);
const [gmailLoading, setGmailLoading] = useState(false);
const [selectedGmailMessage, setSelectedGmailMessage] = useState<any | null>(null);
const [loadingSelectedMessage, setLoadingSelectedMessage] = useState(false);
const [composeTo, setComposeTo] = useState("");
const [composeSubject, setComposeSubject] = useState("");
const [composeBody, setComposeBody] = useState("");
const [sendingEmail, setSendingEmail] = useState(false);
const [gmailSearch, setGmailSearch] = useState("");
const [googleCalendars, setGoogleCalendars] = useState<any[]>([]);
const [calendarLoading, setCalendarLoading] = useState(false);
const [calendarError, setCalendarError] = useState<string | null>(null);
const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
const [calendarEventsLoading, setCalendarEventsLoading] = useState(false);
const [calendarEventsError, setCalendarEventsError] = useState<string | null>(null);
const [driveFiles, setDriveFiles] = useState<any[]>([]);
const [driveLoading, setDriveLoading] = useState(false);
const [driveError, setDriveError] = useState<string | null>(null);
const [driveFolderStack, setDriveFolderStack] = useState<any[]>([]);

const [googleConnection, setGoogleConnection] = useState<{
    connected: boolean;
    email: string | null;
  } | null>(null);
  const [openModules, setOpenModules] = useState<Record<UtilityModuleId, boolean>>({
    calendar: false,
    drive: false,
    gmail: false,
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);

  async function openTeamStatus() {
    if (!user?.org_id) return;

    setTeamStatusOpen(true);
    setTeamStatusLoading(true);
    setTeamStatusError(null);

    try {
      const response = await fetch("/api/tools/team-status", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load team status.");
      }

      setTeamStatusMembers((data?.members || []) as TeamStatusMember[]);
    } catch (error: any) {
      console.error("Failed to load team status:", error);
      setTeamStatusMembers([]);
      setTeamStatusError(error?.message || "Failed to load team status.");
    } finally {
      setTeamStatusLoading(false);
    }
  }

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
        name:
          String((data as any)?.user?.name || "").trim() ||
          membership.title ||
          membership.role ||
          "User",
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
      let googleConnected = false;

      try {
        const googleResponse = await fetch("/api/integrations/google/status", {
          cache: "no-store",
        });
        const googleData = await googleResponse.json();

        googleConnected = googleResponse.ok && Boolean(googleData?.connected);

        setGoogleConnection({
          connected: googleConnected,
          email: googleConnected
            ? googleData?.integration?.provider_account_email ?? null
            : null,
        });
      } catch (error) {
        console.error("Failed to load Google connection:", error);
        setGoogleConnection({
          connected: false,
          email: null,
        });
      }

      if (!googleConnected) {
        setGoogleCalendars([]);
        setCalendarError(null);
        setCalendarLoading(false);
        setCalendarEvents([]);
        setCalendarEventsError(null);
        setCalendarEventsLoading(false);
        setDriveFiles([]);
        setDriveFolderStack([]);
        setDriveError(null);
        setDriveLoading(false);
        setGmailMessages([]);
        setGmailLoading(false);
        setSelectedGmailMessage(null);
      } else {
        try {
          setCalendarLoading(true);
          setCalendarError(null);
          const calendarResponse = await fetch(
            `/api/integrations/google/calendar/calendars?organizationId=${encodeURIComponent(nextUser.org_id)}`,
            { cache: "no-store" }
          );
          const calendarData = await calendarResponse.json();

          if (!calendarResponse.ok) {
            throw new Error(calendarData?.error || "Failed to load Google calendars.");
          }

          setGoogleCalendars(calendarData?.calendars ?? []);
        } catch (error: any) {
          console.error("Failed to load Google calendars:", error);
          setCalendarError(error?.message || "Failed to load Google calendars.");
          setGoogleCalendars([]);
        } finally {
          setCalendarLoading(false);
        }

        try {
          setCalendarEventsLoading(true);
          setCalendarEventsError(null);
          const eventsResponse = await fetch(
            `/api/integrations/google/calendar/events?organizationId=${encodeURIComponent(nextUser.org_id)}`,
            { cache: "no-store" }
          );
          const eventsData = await eventsResponse.json();

          if (!eventsResponse.ok) {
            throw new Error(eventsData?.error || "Failed to load Google Calendar events.");
          }

          setCalendarEvents(eventsData?.events ?? []);
        } catch (error: any) {
          console.error("Failed to load Google Calendar events:", error);
          setCalendarEventsError(error?.message || "Failed to load Google Calendar events.");
          setCalendarEvents([]);
        } finally {
          setCalendarEventsLoading(false);
        }

        try {
          setDriveLoading(true);
          setDriveError(null);

          const driveResponse = await fetch(
            `/api/integrations/google/drive/files?organizationId=${encodeURIComponent(nextUser.org_id)}`,
            { cache: "no-store" }
          );
          const driveData = await driveResponse.json();

          if (!driveResponse.ok) {
            throw new Error(driveData?.error || "Failed to load Google Drive files.");
          }

          setDriveFiles(driveData?.files ?? []);
        } catch (error: any) {
          console.error("Failed to load Google Drive files:", error);
          setDriveError(error?.message || "Failed to load Google Drive files.");
          setDriveFiles([]);
        } finally {
          setDriveLoading(false);
        }

        try {
          setGmailLoading(true);
          const gmailResponse = await fetch(
            "/api/integrations/google/gmail/messages",
            { cache: "no-store" }
          );
          const gmailData = await gmailResponse.json();

          if (!gmailResponse.ok) {
            throw new Error(gmailData?.error || "Failed to load Gmail.");
          }

          setGmailMessages(gmailData?.messages ?? []);
        } catch (error) {
          console.error("Failed to load Gmail preview:", error);
          setGmailMessages([]);
        } finally {
          setGmailLoading(false);
        }
      }

    } catch (error) {
      console.error("Failed to load tools context:", error);
    } finally {
      setLoading(false);
    }
  }


  async function loadDriveFolder(folderId?: string, folder?: any) {
    if (!user) return;
    try {
      setDriveLoading(true);
      setDriveError(null);
      const params = new URLSearchParams({ organizationId: user.org_id });
      if (folderId) params.set("folderId", folderId);
      const response = await fetch(`/api/integrations/google/drive/files?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load Google Drive folder.");
      setDriveFiles(data?.files ?? []);
      if (folder) setDriveFolderStack((current) => [...current, folder]);
      else if (!folderId) setDriveFolderStack([]);
    } catch (error: any) {
      console.error("Failed to load Google Drive folder:", error);
      setDriveError(error?.message || "Failed to load Google Drive folder.");
    } finally {
      setDriveLoading(false);
    }
  }

  async function goToDriveBreadcrumb(index: number) {
    if (!user) return;
    const nextStack = index < 0 ? [] : driveFolderStack.slice(0, index + 1);
    const folderId = nextStack.length ? nextStack[nextStack.length - 1].id : undefined;
    try {
      setDriveLoading(true);
      setDriveError(null);
      const params = new URLSearchParams({ organizationId: user.org_id });
      if (folderId) params.set("folderId", folderId);
      const response = await fetch(`/api/integrations/google/drive/files?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load Google Drive folder.");
      setDriveFiles(data?.files ?? []);
      setDriveFolderStack(nextStack);
    } catch (error: any) {
      setDriveError(error?.message || "Failed to load Google Drive folder.");
    } finally {
      setDriveLoading(false);
    }
  }

  async function openDriveFile(file: any) {
    if (!file?.isFolder) return;
    await loadDriveFolder(file.id, file);
  }

  async function openGmailMessage(messageId: string) {
    if (!user) return;
    try {
      setLoadingSelectedMessage(true);
      const response = await fetch(`/api/integrations/google/gmail/message?organizationId=${user.org_id}&id=${messageId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load message.");
      setSelectedGmailMessage(data.message);
      const from = data.message?.from || "";
      const match = from.match(/<([^>]+)>/);
      setComposeTo(match ? match[1] : from);
      setComposeSubject(data.message?.subject?.startsWith("Re:") ? data.message.subject : `Re: ${data.message?.subject || ""}`);
    } catch (err) {
      console.error(err);
      alert("Failed to load Gmail message.");
    } finally {
      setLoadingSelectedMessage(false);
    }
  }



async function searchGmail() {
  if (!user) return;
  try {
    setGmailLoading(true);
    const response = await fetch("/api/integrations/google/gmail/search",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        organizationId:user.org_id,
        query:gmailSearch,
      }),
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"Search failed.");
    setGmailMessages(data.messages ?? []);
  } catch(err){
    console.error(err);
    alert("Failed to search Gmail.");
  } finally{
    setGmailLoading(false);
  }
}


async function gmailAction(action:string){
  if(!user||!selectedGmailMessage) return;
  try{
    const response=await fetch("/api/integrations/google/gmail/update",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        organizationId:user.org_id,
        messageId:selectedGmailMessage.id,
        action,
      }),
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"Action failed.");
    await loadToolsContext();
    if(action==="archive"||action==="trash"){
      setSelectedGmailMessage(null);
    }else{
      await openGmailMessage(selectedGmailMessage.id);
    }
  }catch(err:any){
    alert(err.message||"Failed Gmail action.");
  }
}

async function sendGmailMessage() {
  if (!user) return;
  try {
    setSendingEmail(true);

    const response = await fetch("/api/integrations/google/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: user.org_id,
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Failed to send email.");

    alert("Email sent.");
    setComposeBody("");
    await loadToolsContext();
  } catch (err:any) {
    alert(err.message || "Failed to send email.");
  } finally {
    setSendingEmail(false);
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

    if (normalizedMessage === ROBBY_TRIGGER) {
      setMessages((prev) => [
        ...prev,
        {
          id: `robby-${Date.now()}`,
          org_id: user.org_id,
          sender_id: "founder",
          sender_name: "Founder Message",
          sender_role: "System",
          message: ROBBY_MESSAGE,
          created_at: new Date().toISOString(),
          system: true,
        },
      ]);

      return;
    }

    if (normalizedMessage === MIKE_TRIGGER) {
      setMessages((prev) => [
        ...prev,
        {
          id: `mike-${Date.now()}`,
          org_id: user.org_id,
          sender_id: "founder",
          sender_name: "Founder Message",
          sender_role: "System",
          message: MIKE_MESSAGE,
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
    const previousCount = previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (previousCount === 0 || messages.length <= previousCount) return;

    const container = messageScrollRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 lg:rounded-2xl lg:p-[18px] lg:text-[11px]">
        Loading tools workspace...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 lg:rounded-2xl lg:p-[18px] lg:text-[11px]">
        No active campaign found. Please log out and log back in with a campaign.
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-6">
      <section
        className={`rounded-3xl border border-slate-800 bg-gradient-to-br p-6 text-white shadow-sm transition-colors duration-300 lg:p-6 ${orgTheme.heroGradient} lg:rounded-2xl lg:p-[18px]`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-4 lg:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Wrench className="h-3.5 w-3.5" />
              Tools Workspace
            </div>

            <div className="space-y-3 lg:space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-3xl lg:text-2xl">
                Campaign coordination and utility shelf.
              </h1>

              <p className="max-w-3xl text-sm text-slate-300 lg:text-sm lg:text-[11px]">
                Tools is where the campaign coordinates, checks shared workspace
                utilities, and reaches infrastructure when the role allows it.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Activity className="h-3.5 w-3.5" />
              {organizationName} • {toolsStatusText}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 lg:gap-2">
            <button
              type="button"
              onClick={openTeamStatus}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
            >
              <Users className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Team Status
            </button>

            {canAccessIntegrations ? (
              <Link
                href="/dashboard/integrations"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
              >
                <PlugZap className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                Open Integrations Hub
                <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {canAccessIntegrations ? (
        <section className="hidden">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 lg:px-2.5 lg:text-[9px]">
                <PlugZap className="h-3.5 w-3.5" />
                Infrastructure Access
              </div>

              <h2 className="text-lg font-semibold text-slate-900 lg:text-base">
                Infrastructure access available
              </h2>

              <p className="max-w-2xl text-sm leading-6 text-slate-500 lg:text-[11px]">
                External signal pathways, ingestion testing, and integration
                management remain available for admins, campaign managers,
                and directors.
              </p>
            </div>

            <Link
              href="/dashboard/integrations"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 lg:rounded-xl lg:px-3 lg:text-[11px]"
            >
              Open Integrations Hub
              <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            </Link>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm lg:rounded-2xl">
        <div
          className={`border-b border-slate-800 bg-gradient-to-br px-6 py-5 text-white ${orgTheme.heroGradient} lg:px-[18px] lg:py-4`}
        >
          <div className="flex items-center justify-between gap-4 lg:gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400 lg:text-[9px]">
                <Radio className="h-3.5 w-3.5" />
                Internal coordination lane
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight lg:text-xl">
                  Campaign Coordination
                </h2>

                <p className="mt-1 text-sm text-slate-300 lg:text-[11px]">
                  Lightweight operational messaging across your active campaign.
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 lg:flex lg:gap-2 lg:rounded-xl lg:px-3 lg:py-2">
              <Activity className="h-4 w-4 text-emerald-400 lg:h-3.5 lg:w-3.5" />

              <div className="text-xs lg:text-[9px]">
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

        <div className="border-b border-slate-200 bg-white px-6 py-4 lg:px-[18px] lg:py-3">
          <div className="flex flex-wrap items-center gap-3 text-sm lg:gap-2 lg:text-[11px]">
            <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700 lg:px-2.5">
              {user.role}
            </div>

            <div className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-fuchsia-700 lg:px-2.5">
              ABE aware
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 lg:px-2.5">
              Live coordination
            </div>

            <div
              className={`rounded-full border px-3 py-1 ${orgTheme.accentBorder} ${orgTheme.accentSoftBg} ${orgTheme.accentText} lg:px-2.5`}
            >
              {orgTheme.label} context
            </div>
          </div>
        </div>

        <div ref={messageScrollRef} className="h-[44vh] overflow-y-auto lg:h-[36vh] bg-slate-100/60 px-5 py-5 lg:px-4 lg:py-4">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:gap-3">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 lg:rounded-xl lg:p-4 lg:text-[11px]">
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
                } lg:rounded-xl lg:p-3`}
              >
                <div className="mb-2 flex items-center gap-2">
                  {message.system ? (
                    <Sparkles className="h-4 w-4 text-fuchsia-600 lg:h-3.5 lg:w-3.5" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-slate-400 lg:h-3.5 lg:w-3.5" />
                  )}

                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 lg:text-[9px]">
                    {message.sender_name} • {message.sender_role}
                  </div>
                </div>

                <div
                  className={`text-sm leading-6 ${
                    message.system ? "text-fuchsia-950" : "text-slate-800"
                  } lg:text-[11px]`}
                >
                  {message.message}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4 lg:px-4 lg:py-3">
          <div className="mx-auto flex max-w-5xl gap-3 lg:gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              placeholder="Coordinate with your campaign team..."
            />

            <button
              onClick={sendMessage}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
            >
              <Send className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Send
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 lg:space-y-3">
        {utilityModules.map((module) => {
          const Icon = module.icon;
          const isOpen = openModules[module.id];

          return (
            <div
              key={module.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:rounded-2xl"
            >
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                className="flex w-full flex-col gap-4 px-5 py-5 text-left transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between lg:gap-3 lg:px-4 lg:py-4"
              >
                <div className="flex items-start gap-4 lg:gap-3">
                  <div
                    className={`rounded-2xl border p-3 ${orgTheme.accentBorder} ${orgTheme.accentSoftBg} lg:rounded-xl`}
                  >
                    <Icon className={`h-5 w-5 ${orgTheme.accentText} lg:h-4 lg:w-4`} />
                  </div>

                  <div>
                    <div
                      className={`text-xs font-semibold uppercase tracking-[0.16em] ${orgTheme.accentText} lg:text-[9px]`}
                    >
                      {module.eyebrow}
                    </div>

                    <h3 className="mt-1 text-xl font-semibold text-slate-950 lg:text-lg">
                      {module.title}
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 lg:text-[11px]">
                      {module.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 lg:px-2.5 lg:text-[9px]">
                    {googleConnection === null
                        ? "Checking"
                        : googleConnection.connected
                          ? "Connected"
                          : "Not connected"}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 text-slate-500 transition ${
                      isOpen ? "rotate-180" : ""
                    } lg:h-4 lg:w-4`}
                  />
                </div>
              </button>

              {isOpen ? (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 lg:px-4 lg:py-4">
                  {!googleConnection?.connected ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:rounded-xl lg:p-4">
                      <div className="font-semibold text-slate-900">
                        Google Workspace is not connected
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600 lg:text-[11px]">
                        Connect the campaign Google account from the Integrations Hub to use {module.title}.
                      </p>
                      {canAccessIntegrations ? (
                        <Link
                          href="/dashboard/integrations"
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:px-3 lg:mt-3 lg:text-[11px]"
                        >
                          Open Integrations Hub
                          <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  ) : module.id === "calendar" ? (
                    <div className="space-y-4 lg:space-y-3">
                      <div className="grid gap-4 md:grid-cols-3 lg:gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Connected</div>
                          <div className="mt-2 font-semibold break-all lg:mt-1.5">
                            {googleConnection?.email || "Google account"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Calendars</div>
                          <div className="mt-2 text-2xl font-bold lg:mt-1.5 lg:text-xl">{googleCalendars.length}</div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Access</div>
                          <div className="mt-2 font-semibold lg:mt-1.5">Read enabled</div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:rounded-xl">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 lg:gap-2 lg:px-4 lg:py-3">
                          <div>
                            <h4 className="font-semibold text-slate-950">Google Calendars</h4>
                            <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                              Calendars available to the connected campaign account.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => loadToolsContext()}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:px-3 lg:text-[11px]"
                          >
                            Refresh
                          </button>
                        </div>

                        {calendarLoading ? (
                          <div className="p-5 text-sm text-slate-500 lg:p-4 lg:text-[11px]">Syncing Google Calendar...</div>
                        ) : calendarError ? (
                          <div className="p-5 text-sm text-red-600 lg:p-4 lg:text-[11px]">{calendarError}</div>
                        ) : googleCalendars.length === 0 ? (
                          <div className="p-5 text-sm text-slate-500 lg:p-4 lg:text-[11px]">
                            No Google calendars were returned for this account.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {googleCalendars.map((calendar: any) => (
                              <div
                                key={calendar.id}
                                className="flex items-center justify-between gap-4 px-5 py-4 lg:gap-3 lg:px-4 lg:py-3"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-300"
                                      style={
                                        calendar.backgroundColor
                                          ? { backgroundColor: calendar.backgroundColor }
                                          : undefined
                                      }
                                    />
                                    <div className="truncate font-semibold text-slate-900">
                                      {calendar.name || calendar.id}
                                    </div>
                                    {calendar.primary ? (
                                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                                        Primary
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                                    {calendar.timeZone || "Calendar timezone unavailable"}
                                  </div>

                                  {calendar.description ? (
                                    <div className="mt-1 text-sm text-slate-600 lg:text-[11px]">
                                      {calendar.description}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 lg:px-2.5 lg:text-[9px]">
                                  {calendar.accessRole || "Available"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:rounded-xl">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 lg:gap-2 lg:px-4 lg:py-3">
                          <div>
                            <h4 className="font-semibold text-slate-950">Upcoming Events</h4>
                            <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                              Upcoming campaign events from the connected Google Calendar.
                            </p>
                          </div>
                          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 lg:px-2.5 lg:text-[9px]">
                            {calendarEvents.length} loaded
                          </div>
                        </div>

                        {calendarEventsLoading ? (
                          <div className="p-5 text-sm text-slate-500 lg:p-4 lg:text-[11px]">Syncing calendar events...</div>
                        ) : calendarEventsError ? (
                          <div className="p-5 text-sm text-red-600 lg:p-4 lg:text-[11px]">{calendarEventsError}</div>
                        ) : calendarEvents.length === 0 ? (
                          <div className="p-5 text-sm text-slate-500 lg:p-4 lg:text-[11px]">
                            No upcoming events were returned for this calendar.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {calendarEvents.map((event: any) => {
                              const startValue =
                                event.start?.dateTime ||
                                event.start?.date ||
                                event.startDateTime ||
                                event.startTime ||
                                event.start;
                              const endValue =
                                event.end?.dateTime ||
                                event.end?.date ||
                                event.endDateTime ||
                                event.endTime ||
                                event.end;
                              const startDate = startValue ? new Date(startValue) : null;
                              const endDate = endValue ? new Date(endValue) : null;
                              const attendees = Array.isArray(event.attendees) ? event.attendees : [];
                              const meetingLink =
                                event.hangoutLink ||
                                event.meetLink ||
                                event.conferenceData?.entryPoints?.find(
                                  (entry: any) => entry.entryPointType === "video"
                                )?.uri;

                              return (
                                <div key={event.id} className="px-5 py-4 lg:px-4 lg:py-3">
                                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between lg:gap-2">
                                    <div className="min-w-0">
                                      <div className="font-semibold text-slate-900">
                                        {event.summary || event.title || "Untitled event"}
                                      </div>
                                      <div className="mt-1 text-sm text-slate-600 lg:text-[11px]">
                                        {startDate && !Number.isNaN(startDate.getTime())
                                          ? startDate.toLocaleString()
                                          : "Start time unavailable"}
                                        {endDate && !Number.isNaN(endDate.getTime())
                                          ? ` — ${endDate.toLocaleString()}`
                                          : ""}
                                      </div>
                                      {event.location ? (
                                        <div className="mt-1 text-sm text-slate-500 lg:text-[11px]">{event.location}</div>
                                      ) : null}
                                      {event.description ? (
                                        <div className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 lg:mt-1.5 lg:text-[11px]">
                                          {event.description}
                                        </div>
                                      ) : null}
                                      {attendees.length > 0 ? (
                                        <div className="mt-2 text-xs text-slate-500 lg:mt-1.5 lg:text-[9px]">
                                          {attendees.length} attendee{attendees.length === 1 ? "" : "s"}
                                        </div>
                                      ) : null}
                                    </div>

                                    <div className="flex shrink-0 flex-wrap gap-2">
                                      {meetingLink ? (
                                        <a
                                          href={meetingLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:px-2.5 lg:text-[9px]"
                                        >
                                          Open Meet
                                        </a>
                                      ) : null}
                                      {event.htmlLink ? (
                                        <a
                                          href={event.htmlLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:px-2.5 lg:text-[9px]"
                                        >
                                          Open in Google
                                        </a>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  ) : module.id === "drive" ? (
                    <div className="space-y-4 lg:space-y-3">
                      <div className="grid gap-4 md:grid-cols-3 lg:gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Connected</div>
                          <div className="mt-2 font-semibold break-all lg:mt-1.5">
                            {googleConnection?.email || "Google account"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Root Items</div>
                          <div className="mt-2 text-2xl font-bold lg:mt-1.5 lg:text-xl">{driveFiles.length}</div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Access</div>
                          <div className="mt-2 font-semibold lg:mt-1.5">Read only</div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:rounded-xl">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 lg:gap-2 lg:px-4 lg:py-3">
                          <div>
                            <h4 className="font-semibold text-slate-950">Google Drive</h4>
                            <p className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                              Campaign files and folders available from the connected Drive.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => loadToolsContext()}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:px-3 lg:text-[11px]"
                          >
                            Refresh
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3 text-sm lg:px-4 lg:py-2 lg:text-[11px]">
                          <button type="button" onClick={() => goToDriveBreadcrumb(-1)} className="font-semibold text-slate-700 hover:text-slate-950">Drive</button>
                          {driveFolderStack.map((folder: any, index: number) => (
                            <div key={folder.id} className="flex items-center gap-2">
                              <ChevronRight className="h-4 w-4 text-slate-400 lg:h-3.5 lg:w-3.5" />
                              <button type="button" onClick={() => goToDriveBreadcrumb(index)} className="font-medium text-slate-600 hover:text-slate-950">{folder.name}</button>
                            </div>
                          ))}
                        </div>

                        {driveLoading ? (
                          <div className="p-5 text-sm text-slate-500 lg:p-4 lg:text-[11px]">Syncing Google Drive...</div>
                        ) : driveError ? (
                          <div className="p-5 text-sm text-red-600 lg:p-4 lg:text-[11px]">{driveError}</div>
                        ) : driveFiles.length === 0 ? (
                          <div className="p-5 text-sm text-slate-500 lg:p-4 lg:text-[11px]">
                            No files or folders were returned from the Drive root.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {driveFiles.map((file: any) => (
                              <div
                                key={file.id}
                                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between lg:gap-2 lg:px-4 lg:py-3"
                              >
                                <div className="flex min-w-0 items-start gap-3 lg:gap-2">
                                  <div className="mt-0.5 rounded-xl border border-slate-200 bg-slate-50 p-2">
                                    <FolderKanban className="h-4 w-4 text-slate-500 lg:h-3.5 lg:w-3.5" />
                                  </div>

                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => openDriveFile(file)}
                                      className="block max-w-full truncate text-left font-semibold text-slate-900 hover:underline"
                                    >
                                      {file.name || "Untitled"}
                                    </button>
                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 lg:text-[9px]">
                                      <span>{file.isFolder ? "Folder" : file.mimeType || "File"}</span>
                                      {file.modifiedTime ? (
                                        <span>
                                          Modified {new Date(file.modifiedTime).toLocaleString()}
                                        </span>
                                      ) : null}
                                      {file.owners?.[0]?.name ? (
                                        <span>{file.owners[0].name}</span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  {file.isFolder ? (
                                    <button
                                      type="button"
                                      onClick={() => openDriveFile(file)}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:px-2.5 lg:text-[9px]"
                                    >
                                      Browse
                                    </button>
                                  ) : null}
                                  {file.shared ? (
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 lg:text-[9px]">
                                      Shared
                                    </span>
                                  ) : null}

                                  {file.webViewLink ? (
                                    <a
                                      href={file.webViewLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 lg:px-2.5 lg:text-[9px]"
                                    >
                                      Open in Google
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  ) : module.id === "gmail" ? (
                    <div className="space-y-4 lg:space-y-3">
                      <div className="grid gap-4 md:grid-cols-4 lg:gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3"><div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Connected</div><div className="mt-2 font-semibold break-all lg:mt-1.5">{googleConnection?.email}</div></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3"><div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Unread</div><div className="mt-2 text-2xl font-bold lg:mt-1.5 lg:text-xl">{gmailMessages.filter((m:any)=>m.unread).length}</div></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3"><div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Loaded</div><div className="mt-2 text-2xl font-bold lg:mt-1.5 lg:text-xl">{gmailMessages.length}</div></div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3"><div className="text-xs uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">Last Sync</div><div className="mt-2 font-semibold lg:mt-1.5">Just now</div></div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden lg:rounded-xl">
<div className="flex items-center gap-3 border-b border-slate-200 p-4 lg:gap-2 lg:p-3">
<input
className="flex-1 rounded-xl border border-slate-200 px-3 py-2 lg:px-2.5"
placeholder="Search Gmail (from:, subject:, is:unread...)"
value={gmailSearch}
onChange={(e)=>setGmailSearch(e.target.value)}
onKeyDown={(e)=>{if(e.key==="Enter") searchGmail();}}
/>
<button
type="button"
onClick={searchGmail}
className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white lg:px-3 lg:text-[11px]"
>
Search
</button>
<button
type="button"
onClick={loadToolsContext}
className="rounded-xl border border-slate-200 px-4 py-2 text-sm lg:px-3 lg:text-[11px]"
>
Reset
</button>
</div>
                        <div className="max-h-[420px] overflow-y-auto lg:max-h-[315px]">
                          {gmailLoading ? <div className="p-5 text-sm text-slate-500 lg:p-4 lg:text-[11px]">Syncing Gmail...</div> : gmailMessages.slice(0,25).map((m:any)=>(
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => openGmailMessage(m.id)}
                              className="group w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 last:border-b-0 lg:p-3"
                            >
                              <div className="flex justify-between gap-3 lg:gap-2">
                                <div className="font-semibold">{m.from}</div>
                                <div className="text-xs text-slate-500 lg:text-[9px]">{m.date}</div>
                              </div>

                              <div className="mt-1 font-medium">{m.subject}</div>

                              <div className="mt-1 flex items-center justify-between gap-3 lg:gap-2">
                                <div className="text-sm text-slate-600 lg:text-[11px]">{m.snippet}</div>
                                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700 lg:h-3.5 lg:w-3.5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {(loadingSelectedMessage || selectedGmailMessage) && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:rounded-xl lg:p-4">
                          {loadingSelectedMessage ? (
                            <div className="text-sm text-slate-500 lg:text-[11px]">Loading message...</div>
                          ) : (
                            <>
                              <div className="text-xl font-semibold lg:text-lg">{selectedGmailMessage?.subject}</div>
                              <div className="mt-4 flex flex-wrap gap-2 lg:mt-3">
<button className="rounded-lg border px-3 py-1 text-sm lg:px-2.5 lg:text-[11px]">Reply</button>
<button onClick={()=>gmailAction("markRead")} className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-100 lg:px-2.5 lg:text-[11px]">Mark Read</button>
<button onClick={()=>gmailAction("archive")} className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-100 lg:px-2.5 lg:text-[11px]">Archive</button>
<button onClick={()=>gmailAction("star")} className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-100 lg:px-2.5 lg:text-[11px]">Star</button>
<button onClick={()=>gmailAction("trash")} className="rounded-lg border px-3 py-1 text-sm hover:bg-red-50 lg:px-2.5 lg:text-[11px]">Trash</button>
</div>
<div className="mt-2 text-sm text-slate-500 lg:mt-1.5 lg:text-[11px]">
                                <div><strong>From:</strong> {selectedGmailMessage?.from}</div>
                                <div><strong>To:</strong> {selectedGmailMessage?.to}</div>
                                <div><strong>Date:</strong> {selectedGmailMessage?.date}</div>
                              </div>
                              <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700 lg:mt-4 lg:text-[11px]">
                                {selectedGmailMessage?.body || selectedGmailMessage?.snippet}
                              </div>
                            </>
                          )}
                        </div>

  )}

  <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:rounded-xl lg:p-4">
    <h4 className="text-lg font-semibold text-slate-900 lg:text-base">Reply / New Email</h4>

    <input
      className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 lg:px-2.5 lg:mt-3"
      placeholder="To"
      value={composeTo}
      onChange={(e)=>setComposeTo(e.target.value)}
    />

    <input
      className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 lg:px-2.5 lg:mt-2"
      placeholder="Subject"
      value={composeSubject}
      onChange={(e)=>setComposeSubject(e.target.value)}
    />

    <textarea
      className="mt-3 min-h-[180px] w-full rounded-xl border border-slate-200 px-3 py-2 lg:px-2.5 lg:mt-2"
      placeholder="Write your email..."
      value={composeBody}
      onChange={(e)=>setComposeBody(e.target.value)}
    />

    <button
      type="button"
      onClick={sendGmailMessage}
      disabled={sendingEmail}
      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50 lg:px-3 lg:mt-3"
    >
      <Send className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
      {sendingEmail ? "Sending..." : "Send Email"}
    </button>
  </div>
</div>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-3 lg:gap-3">
                        {module.items.map((item) => (
                          <div key={`${module.id}-${item.label}`} className="rounded-2xl border border-slate-200 bg-white p-4 lg:rounded-xl lg:p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:text-[9px]">{item.label}</p>
                            <p className="mt-2 text-lg font-semibold text-slate-950 lg:mt-1.5 lg:text-base">{item.value}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600 lg:mt-1.5 lg:text-[11px]">{item.helper}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600 lg:rounded-xl lg:p-3 lg:mt-3 lg:text-[11px]">
                        {googleConnection?.connected ? (<><div className="font-semibold text-slate-900">Connected Account</div><div className="mt-1">{googleConnection.email}</div></>) : <>Google Workspace has not been connected for this campaign.</>}
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      {canAccessIntegrations ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:rounded-2xl lg:p-4">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between lg:gap-4">
            <div className="flex items-start gap-4 lg:gap-3">
              <div className={`rounded-2xl border p-3 ${orgTheme.accentBorder} ${orgTheme.accentSoftBg} lg:rounded-xl`}>
                <Download className={`h-5 w-5 ${orgTheme.accentText} lg:h-4 lg:w-4`} />
              </div>

              <div>
                <div className={`text-xs font-semibold uppercase tracking-[0.16em] ${orgTheme.accentText} lg:text-[9px]`}>
                  Campaign Data
                </div>
                <h2 className="mt-1 text-xl font-semibold text-slate-950 lg:text-lg">
                  Full Data Export
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 lg:text-[11px]">
                  Download the active campaign&apos;s Aether-owned operational data in one export file. Integration secrets and internal Aether infrastructure are excluded.
                </p>
              </div>
            </div>

            <a
              href="/api/export"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-slate-800 lg:rounded-xl lg:px-4 lg:py-2 lg:text-[11px]"
            >
              <Download className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Download Full Export
            </a>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:rounded-2xl lg:px-4 lg:py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 lg:gap-2 lg:text-[11px]">
          <span className="inline-flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-400 lg:h-3.5 lg:w-3.5" />
            {messages.length} coordination messages
          </span>

          <span className="inline-flex items-center gap-2">
            <PlugZap className="h-4 w-4 text-slate-400 lg:h-3.5 lg:w-3.5" />
            {googleConnection?.connected
              ? "3 Google Workspace utilities connected"
              : "Google Workspace not connected"}
          </span>

          <span className={`inline-flex items-center gap-2 ${orgTheme.accentText}`}>
            <Wrench className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            {canAccessIntegrations ? "Infrastructure access enabled" : "Tools workspace"}
          </span>
        </div>
      </section>

      {teamStatusOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 lg:p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTeamStatusOpen(false);
          }}
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:rounded-2xl">
            <div className={`flex items-start justify-between gap-4 bg-gradient-to-br px-6 py-5 text-white ${orgTheme.heroGradient} lg:gap-3 lg:px-[18px] lg:py-4`}>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:text-[9px]">
                  <Users className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  Team Status
                </div>
                <h2 className="mt-2 text-2xl font-semibold lg:mt-1.5 lg:text-xl">{organizationName}</h2>
                <p className="mt-1 text-sm text-slate-300 lg:text-[11px]">
                  Current availability across the active campaign team.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTeamStatusOpen(false)}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/15"
                aria-label="Close team status"
              >
                <X className="h-5 w-5 lg:h-4 lg:w-4" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6 lg:p-[18px]">
              {teamStatusLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 lg:rounded-xl lg:p-4 lg:text-[11px]">
                  Loading team status...
                </div>
              ) : teamStatusError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 lg:rounded-xl lg:p-4 lg:text-[11px]">
                  {teamStatusError}
                </div>
              ) : teamStatusMembers.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 lg:rounded-xl lg:p-4 lg:text-[11px]">
                  No team members found for this campaign.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 lg:rounded-xl">
                  {teamStatusMembers.map((member) => {
                    const statusLabel =
                      member.profile_status === "potato"
                        ? "Potato 🥔"
                        : member.profile_status
                            .split("_")
                            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(" ");

                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:gap-2 lg:px-4 lg:py-3"
                      >
                        <div>
                          <div className="font-semibold text-slate-950">{member.name}</div>
                          <div className="mt-1 text-sm text-slate-500 lg:text-[11px]">
                            {[member.title, member.department, member.role]
                              .filter(Boolean)
                              .filter((value, index, values) => values.indexOf(value) === index)
                              .join(" • ")}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 lg:px-2.5 lg:text-[11px]">
                          {statusLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
