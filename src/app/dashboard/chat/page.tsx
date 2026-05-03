"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  id: string;
  message: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
  system?: boolean;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState({
    name: "You",
    role: "Admin",
    org_id: "demo-org",
    id: "user",
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function loadMessages() {
    const { data } = await supabase
      .from("org_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data as Message[]);
    }
  }

  async function loadIdentity() {
    try {
      const res = await fetch("/api/admin/org-members");
      const data = await res.json();

      const member = data?.currentMember;

      if (member) {
        setUser({
          name: member.title || member.role || "User",
          role: member.role || "User",
          org_id: member.organization_id,
          id: member.id,
        });
      }
    } catch {
      // fallback stays
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;

    await supabase.from("org_messages").insert({
      org_id: user.org_id,
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      message: input,
    });

    setInput("");
  }

  function injectAbeSignal(text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        message: text,
        sender_name: "ABE",
        sender_role: "System",
        created_at: new Date().toISOString(),
        system: true,
      },
    ]);
  }

  useEffect(() => {
    loadMessages();
    loadIdentity();

    const channel = supabase
      .channel("realtime:org_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "org_messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;

          setMessages((prev) => [...prev, newMessage]);

          // simple ABE signal trigger (lightweight)
          if (newMessage.message.toLowerCase().includes("donor")) {
            injectAbeSignal("ABE: Finance pressure increasing — review donor follow-ups.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[70vh] flex-col rounded-3xl border border-slate-200 bg-white">

      <div className="border-b border-slate-200 p-4">
        <h1 className="text-lg font-semibold">Internal Chat</h1>
        <p className="text-xs text-slate-500">Live • Org scoped • ABE aware</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl p-3 ${
              m.system
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-slate-50"
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

      <div className="border-t border-slate-200 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Send a message..."
        />
        <button
          onClick={sendMessage}
          className="rounded-xl bg-black px-4 text-white text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
