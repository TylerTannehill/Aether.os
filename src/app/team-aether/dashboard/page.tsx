"use client";

import { useEffect, useMemo, useState } from "react";

export default function TeamAetherDashboardPage() {
    const [finance, setFinance] = useState<any[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
    const [websiteConnected, setWebsiteConnected] = useState(false);
    const [websiteBusy, setWebsiteBusy] = useState(false);
    const [websiteMessage, setWebsiteMessage] = useState("");
    const [metaConnected, setMetaConnected] = useState(false);
    const [metaBusy, setMetaBusy] = useState(false);
    const [metaMessage, setMetaMessage] = useState("");
    const [xConnected, setXConnected] = useState(false);
    const [xBusy, setXBusy] = useState(false);
    const [xMessage, setXMessage] = useState("");
    const [tiktokConnected, setTikTokConnected] = useState(false);
    const [tiktokBusy, setTikTokBusy] = useState(false);
    const [tiktokMessage, setTikTokMessage] = useState("");
    const [youtubeConnected, setYouTubeConnected] = useState(false);
    const [youtubeBusy, setYouTubeBusy] = useState(false);
    const [youtubeMessage, setYouTubeMessage] = useState("");
    const [newRow, setNewRow] = useState({ name: "", due_date: "", amount: "" });
    const [orgStats, setOrgStats] = useState({
        organizations: 0,
        active: 0,
        suspended: 0,
        pendingDeletion: 0,
    });

    const [salesStats, setSalesStats] = useState({
        leads:0,
        needsFollowUp:0,
        awaitingReply:0,
        upcomingDemos:0,
        interested:0,
        customers:0,
    });

    async function loadSalesStats() {
        const r=await fetch("/api/team-aether/sales-pipeline");
        const d=await r.json();
        const campaigns=Array.isArray(d?.campaigns)?d.campaigns:(Array.isArray(d)?d:[]);
        setSalesStats({
            leads:campaigns.filter((c:any)=>!c.archived).length,
            needsFollowUp:campaigns.filter((c:any)=>c.needs_follow_up&&!c.archived).length,
            awaitingReply:campaigns.filter((c:any)=>c.reply_status==="waiting"&&!c.archived).length,
            upcomingDemos:campaigns.filter((c:any)=>c.demo_status&&c.demo_status!=="Not Set"&&!c.archived).length,
            interested:campaigns.filter((c:any)=>c.interested===true&&!c.archived).length,
            customers:campaigns.filter((c:any)=>c.customer===true&&!c.archived).length,
        });
    }

    async function loadOrganizationStats() {
        const r = await fetch("/api/team-aether/organizations");
        const d = await r.json();
        const orgs = Array.isArray(d.organizations) ? d.organizations : (Array.isArray(d) ? d : []);
        setOrgStats({
            organizations: orgs.length,
            active: orgs.filter((o:any)=>(o.status || "active") === "active").length,
            suspended: orgs.filter((o:any)=>o.status === "suspended").length,
            pendingDeletion: orgs.filter((o:any)=>Boolean(o.scheduled_deletion_at)).length,
        });
    }


    async function loadFinance() {
        const r = await fetch("/api/team-aether/finance");
        const d = await r.json();
        setFinance(Array.isArray(d) ? d : []);
    }

    async function loadWebsiteStatus() {
        try {
            const r = await fetch("/api/integrations/website/status", {
                method: "GET",
                cache: "no-store",
            });
            const d = await r.json();
            setWebsiteConnected(Boolean(r.ok && d?.success && d?.connected));
        } catch {
            setWebsiteConnected(false);
        }
    }

    async function connectWebsite() {
        setWebsiteBusy(true);
        setWebsiteMessage("");
        try {
            const r = await fetch("/api/integrations/website/connect", { method: "POST" });
            const d = await r.json();
            if (!r.ok || !d?.success) {
                throw new Error(d?.error || "Website connection failed.");
            }
            setWebsiteConnected(true);
            setWebsiteMessage("Website connected.");
        } catch (error:any) {
            setWebsiteMessage(error?.message || "Website connection failed.");
        } finally {
            setWebsiteBusy(false);
        }
    }

    async function disconnectWebsite() {
        setWebsiteBusy(true);
        setWebsiteMessage("");
        try {
            const r = await fetch("/api/integrations/website/disconnect", { method: "POST" });
            const d = await r.json();
            if (!r.ok || !d?.success) {
                throw new Error(d?.error || "Website disconnect failed.");
            }
            setWebsiteConnected(false);
            setWebsiteMessage("Website disconnected.");
        } catch (error:any) {
            setWebsiteMessage(error?.message || "Website disconnect failed.");
        } finally {
            setWebsiteBusy(false);
        }
    }

    async function loadMetaStatus() {
        try {
            const r = await fetch("/api/integrations/meta/status", {
                method: "GET",
                cache: "no-store",
            });
            const d = await r.json();
            setMetaConnected(Boolean(r.ok && d?.success && d?.connected));
        } catch {
            setMetaConnected(false);
        }
    }

    function connectMeta() {
        window.location.href = "/api/integrations/meta/connect?returnTo=team-aether";
    }

    async function disconnectMeta() {
        setMetaBusy(true);
        setMetaMessage("");
        try {
            const r = await fetch("/api/integrations/meta/disconnect", { method: "DELETE" });
            const d = await r.json();
            if (!r.ok || !d?.success) {
                throw new Error(d?.message || d?.error || "Meta disconnect failed.");
            }
            setMetaConnected(false);
            setMetaMessage("Meta disconnected.");
        } catch (error:any) {
            setMetaMessage(error?.message || "Meta disconnect failed.");
        } finally {
            setMetaBusy(false);
        }
    }

    async function loadXStatus() {
        try {
            const r = await fetch("/api/integrations/x/status", {
                method: "GET",
                cache: "no-store",
            });
            const d = await r.json();
            setXConnected(Boolean(r.ok && d?.success && d?.connected));
        } catch {
            setXConnected(false);
        }
    }

    function connectX() {
        window.location.href = "/api/integrations/x/connect?returnTo=team-aether";
    }

    async function disconnectX() {
        setXBusy(true);
        setXMessage("");
        try {
            const r = await fetch("/api/integrations/x/disconnect", { method: "DELETE" });
            const d = await r.json();
            if (!r.ok || !d?.success) {
                throw new Error(d?.message || d?.error || "X disconnect failed.");
            }
            setXConnected(false);
            setXMessage("X disconnected.");
        } catch (error:any) {
            setXMessage(error?.message || "X disconnect failed.");
        } finally {
            setXBusy(false);
        }
    }

    async function loadTikTokStatus() {
        try {
            const r = await fetch("/api/integrations/tiktok/status", {
                method: "GET",
                cache: "no-store",
            });
            const d = await r.json();
            setTikTokConnected(Boolean(r.ok && d?.success && d?.connected));
        } catch {
            setTikTokConnected(false);
        }
    }

    function connectTikTok() {
        window.location.href = "/api/integrations/tiktok/connect";
    }

    async function disconnectTikTok() {
        setTikTokBusy(true);
        setTikTokMessage("");
        try {
            const r = await fetch("/api/integrations/tiktok/disconnect", { method: "DELETE" });
            const d = await r.json();
            if (!r.ok || !d?.success) {
                throw new Error(d?.message || d?.error || "TikTok disconnect failed.");
            }
            setTikTokConnected(false);
            setTikTokMessage("TikTok disconnected.");
        } catch (error:any) {
            setTikTokMessage(error?.message || "TikTok disconnect failed.");
        } finally {
            setTikTokBusy(false);
        }
    }

    async function loadYouTubeStatus() {
        try {
            const r = await fetch("/api/integrations/youtube/status", {
                method: "GET",
                cache: "no-store",
            });
            const d = await r.json();
            setYouTubeConnected(Boolean(r.ok && d?.success && d?.connected));
        } catch {
            setYouTubeConnected(false);
        }
    }

    function connectYouTube() {
        window.location.href = "/api/integrations/youtube/connect?returnTo=team-aether";
    }

    async function disconnectYouTube() {
        setYouTubeBusy(true);
        setYouTubeMessage("");
        try {
            const r = await fetch("/api/integrations/youtube/disconnect", { method: "DELETE" });
            const d = await r.json();
            if (!r.ok || !d?.success) {
                throw new Error(d?.message || d?.error || "YouTube disconnect failed.");
            }
            setYouTubeConnected(false);
            setYouTubeMessage("YouTube disconnected.");
        } catch (error:any) {
            setYouTubeMessage(error?.message || "YouTube disconnect failed.");
        } finally {
            setYouTubeBusy(false);
        }
    }

    async function addRow() {
        if (!newRow.name.trim()) return;
        await fetch("/api/team-aether/finance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newRow.name,
                due_date: newRow.due_date || null,
                amount: Number(newRow.amount || 0)
            })
        });
        setNewRow({ name: "", due_date: "", amount: "" });
        loadFinance();
    }

    async function updateRow(id:any, field:string, value:any) {
        await fetch("/api/team-aether/finance",{
            method:"PATCH",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({id,[field]:field==="amount"?Number(value):value})
        });
        loadFinance();
    }

    async function deleteRow(id:any){
        await fetch("/api/team-aether/finance",{
            method:"DELETE",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({id})
        });
        loadFinance();
    }

    useEffect(() => {
        loadFinance().catch(()=>setFinance([]));
        loadOrganizationStats().catch(()=>{});
        loadSalesStats().catch(()=>{});
        loadWebsiteStatus().catch(()=>setWebsiteConnected(false));
        loadMetaStatus().catch(()=>setMetaConnected(false));
        loadXStatus().catch(()=>setXConnected(false));
        loadTikTokStatus().catch(()=>setTikTokConnected(false));
        loadYouTubeStatus().catch(()=>setYouTubeConnected(false));
    }, []);

    const total = useMemo(
        () => finance.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        [finance]
    );

    return (
        <main className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">

                {/* Hero */}
                <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                        <div>
                            <div className="inline-flex items-center rounded-full border border-slate-700 px-4 py-1 text-xs font-bold tracking-wider text-slate-300">TEAM AETHER</div>
                            <h1 className="mt-5 text-5xl font-bold">Dashboard</h1>
                            <p className="mt-4 max-w-2xl text-lg text-slate-400">
                                Monitor sales, organizations, finance, and platform activity from one operational workspace.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 xl:pl-12">
                            <a href="/team-aether/sales-help" className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-4 text-center">Sales Help</a>
                            <a href="/team-aether/dashboard" className="rounded-2xl border border-white bg-slate-800 px-6 py-4 text-center font-semibold">Dashboard</a>
                            <a href="/login" className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-4 text-center">Logout</a>
                            <a href="/team-aether/organizations" className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-4 text-center">Organizations</a>
                            <a href="/team-aether" className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-4 text-center">Provisioning</a>
                            <a href="/team-aether/sales-pipeline" className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-4 text-center">Sales Pipeline</a>
                            <a href="/team-aether/email-templates" className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-4 text-center">Email Templates</a>
                            <a href="/team-aether/support-portal" className="col-span-2 rounded-2xl border border-slate-700 bg-slate-800 px-6 py-4 text-center">Support</a>
                        </div>
                    </div>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Sales Pipeline */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <h2 className="text-2xl font-semibold mb-6">
                            Sales Pipeline
                        </h2>

                        <div className="space-y-3 text-slate-300">
                            <div className="flex justify-between">
                                <span>Leads</span><span>{salesStats.leads}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Needs Follow Up</span><span>{salesStats.needsFollowUp}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Awaiting Reply</span><span>{salesStats.awaitingReply}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Upcoming Demos</span><span>{salesStats.upcomingDemos}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Interested</span><span>{salesStats.interested}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Customers</span><span>{salesStats.customers}</span>
                            </div>
                        </div>
                    </div>

                    {/* Organizations */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <h2 className="text-2xl font-semibold mb-6">
                            Organizations
                        </h2>

                        <div className="space-y-3 text-slate-300">
                            <div className="flex justify-between"><span>Organizations</span><span>{orgStats.organizations}</span></div>
                            <div className="flex justify-between"><span>Active</span><span>{orgStats.active}</span></div>
                            <div className="flex justify-between"><span>Suspended</span><span>{orgStats.suspended}</span></div>
                            <div className="flex justify-between"><span>Pending Deletion</span><span>{orgStats.pendingDeletion}</span></div>
                        </div>
                    </div>

                    {/* Finance */}
                    <div onClick={() => setExpanded(!expanded)} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 cursor-pointer hover:border-purple-500 transition">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold">Finance</h2>
                            <div className="text-right">
                                <div className="text-xl font-bold">{total >= 0 ? "+" : ""}${total.toFixed(2)}</div>
                                <div className="text-xs text-slate-400">{finance.length} Items</div>
                            </div>
                        </div>

                        {expanded && (
                        <>
                        <div className="grid grid-cols-3 gap-4 pb-3 border-b border-slate-700 text-sm font-semibold text-slate-400">
                            <div>Name</div>
                            <div>Due Date</div>
                            <div className="text-right">Amount</div>
                        </div>

                        {finance.length === 0 ? (
                            <div className="py-4 text-slate-500 text-center">No finance items.</div>
                        ) : (
                            finance.map((row) => (
                                <div key={row.id} className="grid grid-cols-3 gap-3 py-3 border-b border-slate-800 items-center" onClick={(e)=>e.stopPropagation()}>
                                    <input className="bg-slate-800 rounded px-2 py-1" defaultValue={row.name}
                                        onBlur={(e)=>updateRow(row.id,"name",e.target.value)} />
                                    <input type="date" className="bg-slate-800 rounded px-2 py-1" defaultValue={row.due_date ?? ""}
                                        onBlur={(e)=>updateRow(row.id,"due_date",e.target.value)} />
                                    <div className="flex items-center justify-between bg-slate-800 rounded px-2 py-1">
                                        <input
                                            type="number"
                                            className="bg-transparent w-full text-right outline-none"
                                            defaultValue={row.amount}
                                            onBlur={(e)=>updateRow(row.id,"amount",e.target.value)}
                                        />
                                        <button
                                            onClick={()=>deleteRow(row.id)}
                                            className="ml-2 text-red-400 hover:text-red-300 flex-shrink-0"
                                            title="Delete"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        <div className="pt-4 space-y-3" onClick={(e)=>e.stopPropagation()}>
                            <div className="grid grid-cols-3 gap-3">
                                <input className="bg-slate-800 rounded px-2 py-1" placeholder="Name" value={newRow.name} onChange={(e)=>setNewRow({...newRow,name:e.target.value})}/>
                                <input type="date" className="bg-slate-800 rounded px-2 py-1" value={newRow.due_date} onChange={(e)=>setNewRow({...newRow,due_date:e.target.value})}/>
                                <input type="number" className="bg-slate-800 rounded px-2 py-1" placeholder="Amount" value={newRow.amount} onChange={(e)=>setNewRow({...newRow,amount:e.target.value})}/>
                            </div>
                            <div className="flex justify-center">
                                <button onClick={addRow} className="rounded-lg bg-purple-600 hover:bg-purple-500 px-6 py-2 font-medium">
                                    Add Entry
                                </button>
                            </div>
                        </div>
                        </>
                        )}
                    </div>

                    {/* Socials */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold">Socials</h2>
                            <button onClick={() => setIntegrationModalOpen(true)} className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 font-medium">
                                Connect
                            </button>
                        </div>

                        <div className="space-y-5">
                            {[
                                ["Website","Visitors","Page Views","Conversions"],
                                ["Meta","Followers","Reach","Engagement"],
                                ["X","Followers","Impressions","Engagement"],
                                ["TikTok","Followers","Views","Engagement"],
                                ["YouTube","Subscribers","Views","Watch Time"],
                            ].map(([title,a,b,c])=>(
                                <div key={title} className="border-b border-slate-800 pb-4 last:border-0">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-semibold">{title}</span>
                                        <span className={
                                            (title === "Website" && websiteConnected) ||
                                            (title === "Meta" && metaConnected) ||
                                            (title === "X" && xConnected) ||
                                            (title === "TikTok" && tiktokConnected) ||
                                            (title === "YouTube" && youtubeConnected)
                                                ? "text-emerald-400"
                                                : "text-slate-500"
                                        }>
                                            {(title === "Website" && websiteConnected) ||
                                            (title === "Meta" && metaConnected) ||
                                            (title === "X" && xConnected) ||
                                            (title === "TikTok" && tiktokConnected) ||
                                            (title === "YouTube" && youtubeConnected)
                                                ? "Connected"
                                                : "Not Connected"}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm text-slate-300">
                                        <div className="flex justify-between"><span>{a}</span><span>0</span></div>
                                        <div className="flex justify-between"><span>{b}</span><span>0</span></div>
                                        <div className="flex justify-between"><span>{c}</span><span>0</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {integrationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIntegrationModalOpen(false)}>
                    <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-purple-400">Team Aether</div>
                                <h2 className="mt-2 text-2xl font-semibold">Manage Social Connections</h2>
                                <p className="mt-2 text-sm text-slate-400">Connect the data sources used by the Team Aether Socials dashboard.</p>
                            </div>
                            <button onClick={() => setIntegrationModalOpen(false)} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close integrations">✕</button>
                        </div>

                        <div className="mt-6 space-y-3">
                            {["Website", "Meta", "X", "TikTok", "YouTube"].map((integration) => {
                                const isWebsite = integration === "Website";
                                const isMeta = integration === "Meta";
                                const isX = integration === "X";
                                const isTikTok = integration === "TikTok";
                                const isYouTube = integration === "YouTube";
                                const connected = isWebsite ? websiteConnected : isMeta ? metaConnected : isX ? xConnected : isTikTok ? tiktokConnected : isYouTube ? youtubeConnected : false;
                                const busy = isWebsite ? websiteBusy : isMeta ? metaBusy : isX ? xBusy : isTikTok ? tiktokBusy : isYouTube ? youtubeBusy : false;
                                const connectAction = isWebsite ? connectWebsite : isMeta ? connectMeta : isX ? connectX : isTikTok ? connectTikTok : isYouTube ? connectYouTube : undefined;
                                const disconnectAction = isWebsite ? disconnectWebsite : isMeta ? disconnectMeta : isX ? disconnectX : isTikTok ? disconnectTikTok : isYouTube ? disconnectYouTube : undefined;

                                return (
                                    <div key={integration} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
                                        <div>
                                            <div className="font-semibold text-white">{integration}</div>
                                            <div className={`mt-1 text-xs ${connected ? "text-emerald-400" : "text-slate-500"}`}>
                                                {connected ? "Connected" : "Not connected"}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={connectAction}
                                                disabled={(isWebsite || isMeta || isX || isTikTok || isYouTube) && (busy || connected)}
                                                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                {busy ? "Working..." : "Connect"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={disconnectAction}
                                                disabled={(isWebsite || isMeta || isX || isTikTok || isYouTube) && (busy || !connected)}
                                                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Disconnect
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {(websiteMessage || metaMessage || xMessage || tiktokMessage || youtubeMessage) && (
                            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                                {youtubeMessage || tiktokMessage || xMessage || metaMessage || websiteMessage}
                            </div>
                        )}
                        <div className="mt-6 text-xs text-slate-500">Website, Meta, X, TikTok, and YouTube dashboard connection actions are wired. TikTok OAuth remains unavailable until provider configuration is completed.</div>
                    </div>
                </div>
            )}
        </main>
    );
}