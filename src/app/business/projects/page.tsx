"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { CalendarDays, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, FolderKanban, ListTodo, Plus, Trash2, UserRound, AlertTriangle } from "lucide-react";

type Status = "todo" | "progress" | "blocked" | "done";
type TeamMember = { id: string; user_id: string; name: string; role: string; department: string | null; profile_status: string };
type Assignment = { work_item_id: string; organization_member_id: string };
type WorkItem = { id: string; parentId: string | null; title: string; description: string; dueDate: string; completedDate: string; status: Status; assignee: string; };
const lanes: { key: Status; title: string; color: string }[] = [
  { key: "todo", title: "To Do", color: "bg-slate-100 text-slate-700" },
  { key: "progress", title: "In Progress", color: "bg-blue-50 text-blue-700" },
  { key: "blocked", title: "Blocked", color: "bg-amber-50 text-amber-800" },
  { key: "done", title: "Completed", color: "bg-emerald-50 text-emerald-700" },
];
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function newId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }

export default function BusinessProjectsPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [view, setView] = useState<"board" | "mine">("board");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const assignmentIds = (workItemId: string) => assignments.filter(a => a.work_item_id === workItemId).map(a => a.organization_member_id);
  const assigneeNames = (workItemId: string) => assignmentIds(workItemId).map(id => teamMembers.find(m => m.id === id)?.name || "Team member").join(", ");
  const selected = items.find(i => i.id === selectedId) ?? null;
  const date = today();
  const children = (parentId: string | null) => items.filter(i => i.parentId === parentId);
  const descendants = (id: string): WorkItem[] => {
    const result: WorkItem[] = [];
    const seen = new Set<string>([id]);
    const visit = (parent: string) => { for (const child of items.filter(i => i.parentId === parent)) { if (seen.has(child.id)) continue; seen.add(child.id); result.push(child); visit(child.id); } };
    visit(id); return result;
  };
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/auth/current-context", { credentials: "include" });
        const context = await response.json();
        if (!response.ok || !context?.organization?.id) throw new Error("No active Business organization found.");
        const org = context.organization.id as string;
        const { data, error } = await supabase.from("business_work_items")
          .select("id,parent_id,title,description,status,due_date,completed_date")
          .eq("organization_id", org).order("created_at", { ascending: true });
        if (error) throw error;
        const [teamResponse, assignmentResult] = await Promise.all([
          fetch("/api/tools/team-status", { credentials: "include" }),
          supabase.from("business_work_assignments").select("work_item_id,organization_member_id").eq("organization_id", org),
        ]);
        if (!teamResponse.ok) throw new Error(`Team directory failed: ${teamResponse.status}`);
        const teamData = await teamResponse.json();
        if (teamData.organization_id !== org) throw new Error("Team directory organization does not match active organization.");
        if (assignmentResult.error) throw assignmentResult.error;
        // Match the same authenticated session identity used by Business Profile.
        // The context membership is authoritative for the active organization.
        const members: TeamMember[] = Array.isArray(teamData.members) ? teamData.members : [];
        const sessionMembershipId = String(context?.membership?.id ?? "").trim();
        const sessionUserId = String(context?.user?.id ?? "").trim();
        const sessionAuthId = String(context?.user?.auth_id ?? "").trim();
        const selfMembership = members.find(member =>
          (sessionMembershipId && member.id === sessionMembershipId) ||
          (sessionUserId && member.user_id === sessionUserId) ||
          (sessionAuthId && member.user_id === sessionAuthId)
        )?.id ?? null;
        if (cancelled) return;
        setTeamMembers(teamData.members ?? []);
        setAssignments(assignmentResult.data ?? []);
        setCurrentMemberId(selfMembership);
        setOrganizationId(org);
        setItems((data ?? []).map(row => ({
          id: row.id, parentId: row.parent_id, title: row.title ?? "",
          description: row.description ?? "", status: row.status as Status,
          dueDate: row.due_date ?? "", completedDate: row.completed_date ?? "", assignee: ""
        })));
      } catch (err) {
        if (!cancelled) setErrorMessage(err instanceof Error ? err.message : "Unable to load work items.");
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const persist = async (id: string, patch: Partial<WorkItem>) => {
    if (!organizationId) return;
    const columns: Record<string, unknown> = {};
    if (patch.title !== undefined) columns.title = patch.title;
    if (patch.description !== undefined) columns.description = patch.description;
    if (patch.status !== undefined) columns.status = patch.status;
    if (patch.dueDate !== undefined) columns.due_date = patch.dueDate || null;
    if (patch.completedDate !== undefined) columns.completed_date = patch.completedDate || null;
    if (!Object.keys(columns).length) return;
    setSaving(true);
    const { error } = await supabase.from("business_work_items").update(columns)
      .eq("organization_id", organizationId).eq("id", id);
    setSaving(false);
    if (error) setErrorMessage(`Save failed: ${error.message}`);
    else setErrorMessage("");
  };
  const update = (id: string, patch: Partial<WorkItem>) => {
    setItems(current => current.map(i => i.id === id ? { ...i, ...patch } : i));
    // Text edits are persisted on blur; status and dates are saved immediately.
    if (patch.status !== undefined || patch.dueDate !== undefined || patch.completedDate !== undefined)
      void persist(id, patch);
  };
  const add = async (parentId: string | null = null, status: Status = "todo") => {
    if (!organizationId) return;
    setSaving(true);
    const { data, error } = await supabase.from("business_work_items")
      .insert({ organization_id: organizationId, parent_id: parentId, title: "", description: "", status })
      .select("id").single();
    setSaving(false);
    if (error || !data) { setErrorMessage(`Create failed: ${error?.message ?? "No item returned"}`); return; }
    const id = data.id as string;
    setItems(current => [...current, { id, parentId, title: "", description: "", dueDate: "", completedDate: "", status, assignee: "" }]);
    if (parentId) setExpanded(current => [...new Set([...current, parentId])]);
    setSelectedId(id);
    setErrorMessage("");
  };
  const remove = async (id: string) => {
    if (!organizationId) return;
    setSaving(true);
    const { error } = await supabase.from("business_work_items").delete()
      .eq("organization_id", organizationId).eq("id", id);
    setSaving(false);
    if (error) { setErrorMessage(`Delete failed: ${error.message}`); return; }
    const ids = new Set([id, ...descendants(id).map(i => i.id)]);
    setItems(current => current.filter(i => !ids.has(i.id)));
    setAssignments(current => current.filter(a => !ids.has(a.work_item_id)));
    if (selectedId && ids.has(selectedId)) setSelectedId(null);
    setErrorMessage("");
  };
  const changeStatus = (id: string, status: Status) => update(id, { status, completedDate: status === "done" ? date : "" });
  const roots = children(null);
  const active = items.filter(i => i.status !== "done");
  const overdue = active.filter(i => i.dueDate && i.dueDate < date);
  const dueSoon = active.filter(i => i.dueDate && i.dueDate >= date && i.dueDate <= new Date(Date.now()+7*86400000).toLocaleDateString("en-CA"));
  const owners = useMemo(() => {
    const counts = new Map<string, { total: number; overdue: number }>();
    for (const assignment of assignments) {
      const item = items.find(i => i.id === assignment.work_item_id);
      const member = teamMembers.find(m => m.id === assignment.organization_member_id);
      if (!item || !member || item.status === "done") continue;
      const old = counts.get(member.name) ?? { total: 0, overdue: 0 };
      counts.set(member.name, { total: old.total + 1, overdue: old.overdue + Number(!!item.dueDate && item.dueDate < date) });
    }
    return [...counts.entries()].sort((a,b) => b[1].total-a[1].total);
  }, [items, assignments, teamMembers, date]);
  const myItems = currentMemberId ? items.filter(i => assignmentIds(i.id).includes(currentMemberId)) : [];

  const setAssignment = async (workItemId: string, memberId: string, checked: boolean) => {
    if (!organizationId || assignmentSaving) return;
    setAssignmentSaving(true);
    const result = checked
      ? await supabase.from("business_work_assignments").insert({ organization_id: organizationId, work_item_id: workItemId, organization_member_id: memberId })
      : await supabase.from("business_work_assignments").delete().eq("organization_id", organizationId).eq("work_item_id", workItemId).eq("organization_member_id", memberId);
    setAssignmentSaving(false);
    if (result.error) { setErrorMessage(`Assignment failed: ${result.error.message}`); return; }
    setAssignments(current => checked
      ? [...current.filter(a => !(a.work_item_id === workItemId && a.organization_member_id === memberId)), { work_item_id: workItemId, organization_member_id: memberId }]
      : current.filter(a => !(a.work_item_id === workItemId && a.organization_member_id === memberId)));
    setErrorMessage("");
  };

  function itemRow(item: WorkItem, depth = 0): React.ReactNode {
    const sub = children(item.id); const isExpanded = expanded.includes(item.id);
    const all = descendants(item.id); const finished = all.filter(i => i.status === "done").length;
    return <div key={item.id}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-3 hover:bg-slate-50" style={{ paddingLeft: `${12 + Math.min(depth, 10)*18}px` }}>
        {sub.length ? <button type="button" aria-label={isExpanded ? "Collapse steps" : "Expand steps"} onClick={() => setExpanded(v => isExpanded ? v.filter(x => x !== item.id) : [...v,item.id])} className="rounded p-1 hover:bg-slate-200">{isExpanded ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}</button> : <span className="w-6"/>}
        <button type="button" aria-label="Open task editor" onClick={() => setSelectedId(item.id)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold text-slate-900">{item.title || "Untitled work item"}</span><span className="block truncate text-xs text-slate-500">{sub.length ? `${sub.length} direct steps · ${finished}/${all.length} nested complete` : item.description || "Click to add details"}</span></button>
        <select aria-label="Work status" value={item.status} onChange={e => changeStatus(item.id, e.target.value as Status)} className="max-w-[112px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700">{lanes.map(l => <option key={l.key} value={l.key}>{l.title}</option>)}</select>
        <button type="button" onClick={() => add(item.id)} aria-label="Add nested step" title="Add nested step" className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"><Plus className="h-4 w-4"/></button>
      </div>
      {isExpanded && sub.map(child => itemRow(child, depth+1))}
    </div>;
  }

  return <main className="min-h-screen bg-slate-50 text-slate-900"><div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
    <section className="rounded-3xl border border-slate-900 bg-slate-950 p-6 text-white shadow-sm lg:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200"><FolderKanban className="h-3.5 w-3.5"/> Business Projects & Tasks</div><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Work Command Center</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Organize work, build nested projects, and see who owns the next step.</p></div><button type="button" onClick={() => add()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20"><Plus className="h-4 w-4"/> New Work Item</button></div></section>
    {loading && <div className="rounded-xl bg-white p-3 text-sm text-slate-600">Loading organization work items…</div>}
    {saving && <div className="text-xs text-slate-500">Saving…</div>}
    {errorMessage && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{errorMessage}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { label:"Open Steps",value:active.length,icon:ListTodo,detail:"Unfinished tasks at every level" },
      { label:"Due This Week",value:dueSoon.length,icon:CalendarDays,detail:"Upcoming deadlines" },
      { label:"Overdue",value:overdue.length,icon:AlertTriangle,detail:"Past-due unfinished work" },
      { label:"Completed",value:items.filter(i => i.status === "done").length,icon:CheckCircle2,detail:"Finished steps" },
    ].map(m => { const Icon=m.icon; return <article key={m.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{m.label}</p><p className="mt-3 text-3xl font-semibold text-slate-950">{m.value}</p></div><div className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><Icon className="h-4 w-4"/></div></div><p className="mt-3 text-xs text-slate-500">{m.detail}</p></article>; })}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Work Management</p><h2 className="mt-1 text-xl font-semibold">Your operational board</h2></div><div className="inline-flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setView("board")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "board" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>All Work</button><button type="button" onClick={() => setView("mine")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "mine" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>My Tasks</button></div></div>
      {view === "board" ? <><div className="mt-5 grid gap-3 lg:grid-cols-4">{lanes.map(lane => <div key={lane.key} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${lane.color}`}>{lane.title}</span><span className="text-xs text-slate-500">{roots.filter(i => i.status === lane.key).length}</span></div><div className="mt-3 space-y-2">{roots.filter(i => i.status === lane.key).map(item => <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => setSelectedId(item.id)} className="w-full p-3 text-left transition hover:bg-slate-50"><p className="break-words text-sm font-semibold">{item.title || "Untitled work item"}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description || "No description"}</p><p className="mt-2 text-xs text-slate-500">{item.dueDate ? `Due ${item.dueDate}` : "No due date"}</p>{assigneeNames(item.id) && <p className="mt-1 truncate text-xs text-slate-500">{assigneeNames(item.id)}</p>}</button>{children(item.id).length > 0 && (() => { const all = descendants(item.id); const done = all.filter(step => step.status === "done").length; const percent = all.length ? Math.round(done / all.length * 100) : 0; return <div className="border-t border-slate-100 px-3 py-3"><div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500"><span>{done} of {all.length} nested tasks complete</span><span>{percent}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }}/></div></div>; })()}<button type="button" onClick={() => add(item.id)} className="flex w-full items-center gap-1 border-t border-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5"/> Add step</button></div>)}<button type="button" onClick={() => add(null,lane.key)} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-white"><Plus className="h-3.5 w-3.5"/> Add item</button></div></div>)}</div>
      <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-base font-semibold">Project & Task Hierarchy</h3><span className="text-xs text-slate-500">Unlimited nested steps</span></div><div className="overflow-hidden rounded-xl border border-slate-200">{roots.length ? roots.map(i => itemRow(i)) : <div className="p-8 text-center text-sm text-slate-500">No work items yet. Create your first task above.</div>}</div></div></> : <div className="mt-5"><p className="mb-3 text-sm text-slate-600">Work assigned to your signed-in account.</p><div className="overflow-hidden rounded-xl border border-slate-200">{myItems.length ? myItems.map(i => itemRow(i)) : <div className="p-8 text-center text-sm text-slate-500">{currentMemberId ? "No tasks assigned to you yet." : "Unable to identify your organization membership from the current session."}</div>}</div></div>}

    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-slate-500"/><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Responsibility Highlights</p></div><h2 className="mt-2 text-xl font-semibold">Who owns the work?</h2>{owners.length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{owners.map(([name,counts]) => <div key={name} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold">{name}</p><p className="mt-1 text-sm text-slate-600">{counts.total} active assignment{counts.total===1?"":"s"}</p><p className={`mt-1 text-xs ${counts.overdue ? "text-rose-700" : "text-emerald-700"}`}>{counts.overdue ? `${counts.overdue} overdue` : "No overdue work"}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No assignments yet. Assign work in the item editor to populate this panel.</p>}</section>
  </div>
  {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedId(null); }}><section role="dialog" aria-modal="true" aria-label="Edit work item" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Work Item Editor</p><h2 className="mt-1 text-xl font-semibold">{children(selected.id).length ? "Project / Parent Task" : "Task"}</h2></div><button type="button" onClick={() => setSelectedId(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Close</button></div><div className="mt-5 space-y-4"><label className="block text-sm font-semibold">Title<input autoFocus value={selected.title} onChange={e => update(selected.id,{title:e.target.value})} onBlur={e => void persist(selected.id,{title:e.target.value})} placeholder="Name this task or project" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="block text-sm font-semibold">Description<textarea rows={3} value={selected.description} onChange={e => update(selected.id,{description:e.target.value})} onBlur={e => void persist(selected.id,{description:e.target.value})} placeholder="Describe the work" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Due date<input type="date" value={selected.dueDate} onChange={e => update(selected.id,{dueDate:e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="block text-sm font-semibold">Completed date<input type="date" value={selected.completedDate} onChange={e => update(selected.id,{completedDate:e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Status<select value={selected.status} onChange={e => changeStatus(selected.id,e.target.value as Status)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal">{lanes.map(l => <option key={l.key} value={l.key}>{l.title}</option>)}</select></label><div className="block text-sm font-semibold">Assigned to <span className="font-normal text-slate-500">(multiple team members allowed)</span><div className="mt-1 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">{teamMembers.length ? teamMembers.map(member => <label key={member.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-normal hover:bg-slate-50"><input type="checkbox" disabled={assignmentSaving} checked={assignmentIds(selected.id).includes(member.id)} onChange={e => void setAssignment(selected.id, member.id, e.target.checked)} /><span className="min-w-0"><span className="block font-semibold">{member.name}</span><span className="block text-xs text-slate-500">{member.role}{member.department ? ` · ${member.department}` : ""}</span></span></label>) : <p className="px-2 py-1 text-xs font-normal text-slate-500">No team members loaded.</p>}</div></div></div><div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={() => { if (globalThis.confirm("Delete this item and all nested steps?")) remove(selected.id); }} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700"><Trash2 className="h-4 w-4"/> Delete</button><button type="button" onClick={() => { add(selected.id); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4"/> Add Nested Step</button></div></div></section></div>}
  </main>;
}
