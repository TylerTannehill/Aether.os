import { Contact, Priority, TaskStatus } from "./types";

export function fullName(contact?: Contact | null) {
  if (!contact) return "Unnamed Contact";
  return `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || "Unnamed Contact";
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function formatCreatedAt(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function deriveStatusLabel(result?: string | null) {
  if (!result) return "Unreached";

  const normalized = result.toLowerCase();

  if (
    normalized.includes("answered") ||
    normalized.includes("responded") ||
    normalized.includes("callback")
  ) {
    return "Engaged";
  }

  if (normalized.includes("opt out")) {
    return "Do Not Contact";
  }

  return "Attempted";
}

export function isToday(dateStr?: string | null) {
  if (!dateStr) return false;

  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return false;

  return target.toDateString() === new Date().toDateString();
}

export function isOverdue(dateStr?: string | null) {
  if (!dateStr) return false;

  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return false;

  const now = new Date();
  return target.getTime() < now.getTime() && target.toDateString() !== now.toDateString();
}

export function statusClasses(status: TaskStatus) {
  switch (status) {
    case "open":
      return "border border-blue-200 bg-blue-100 text-blue-700";
    case "in_progress":
      return "border border-amber-200 bg-amber-100 text-amber-700";
    case "done":
      return "border border-emerald-200 bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "border border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function priorityClasses(priority: Priority) {
  switch (priority) {
    case "low":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    case "medium":
      return "border border-blue-200 bg-blue-100 text-blue-700";
    case "high":
      return "border border-orange-200 bg-orange-100 text-orange-700";
    case "urgent":
      return "border border-rose-200 bg-rose-100 text-rose-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}