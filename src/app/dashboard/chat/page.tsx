"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading campaign chat...
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
    <div className="flex h-[70vh] flex-col rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <h1 className="text-lg font-semibold">Internal Chat</h1>
        <p className="text-xs text-slate-500">Live • Campaign scoped • ABE aware</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl p-3 ${
              m.system ? "border border-yellow-200 bg-yellow-50" : "bg-slate-50"
            }`}
          >
            <div className="text-xs text-slate-500">
              {m.sender_name} • {m.sender_role}
            </div>
            <div className="text-sm text-slate-900">{m.message}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Send a message..."
        />
        <button
          onClick={sendMessage}
          className="rounded-xl bg-black px-4 text-sm text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}