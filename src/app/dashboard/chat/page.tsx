"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Activity,
  MessageSquare,
  Radio,
  Send,
  Sparkles,
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMode, setContextMode] = useState("default");

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

  async function loadIdentityAndMessages() {
    try {
      const res = await fetch("/api/admin/org-members");
      const data = await res.json();

      const member = data?.currentMember;

      if (!member?.organization_id) {
        setLoading(false);
        return;
      }

      const nextUser: CurrentUser = {
        name: member.title || member.role || "User",
        role: member.role || "User",
        org_id: member.organization_id,
        id: member.id,
      };

      setUser(nextUser);

      setContextMode(
        data?.organization?.context_mode || "default"
      );

      await loadMessages(nextUser.org_id);
    } catch (error) {
      console.error("Failed to load chat identity:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !user) return;

    const messageText = input.trim();
    setInput("");

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

  useEffect(() => {
    loadIdentityAndMessages();
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

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading campaign coordination...
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
    <div className="flex h-[78vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
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
              <h1 className="text-2xl font-semibold tracking-tight">
                Campaign Coordination
              </h1>

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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-100/60 px-5 py-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl border p-4 shadow-sm transition ${
                m.system
                  ? "border-fuchsia-200 bg-fuchsia-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                {m.system ? (
                  <Sparkles className="h-4 w-4 text-fuchsia-600" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                )}

                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  {m.sender_name} • {m.sender_role}
                </div>
              </div>

              <div
                className={`text-sm leading-6 ${
                  m.system ? "text-fuchsia-950" : "text-slate-800"
                }`}
              >
                {m.message}
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
            onChange={(e) => setInput(e.target.value)}
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
    </div>
  );
}