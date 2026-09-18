"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, ChevronRight, DoorOpen, ExternalLink, Eye, Globe2, HandCoins, Megaphone, Phone, Printer, Search, X } from "lucide-react";

type Office = "State House" | "State Senate" | "Governor" | "Mayor" | "U.S. House" | "U.S. Senate";
type MetricKey = "doors" | "impressions" | "raised" | "print" | "financeCalls" | "outreachCalls";
type Campaign = { id:string; name:string; state:string; office:Office; district?:string; website?:string; donateUrl?:string; metrics:Partial<Record<MetricKey,number>> };

const states = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
const offices:Office[] = ["State House","State Senate","Governor","Mayor","U.S. House","U.S. Senate"];

const metricDetails:Record<MetricKey,{label:string;sentence:(v:number)=>string;icon:typeof DoorOpen}> = {
 doors:{label:"Doors Knocked",sentence:v=>`We've visited ${v.toLocaleString()} homes.`,icon:DoorOpen},
 impressions:{label:"Digital Impressions",sentence:v=>`${v.toLocaleString()} impressions have been delivered across our digital platforms.`,icon:Eye},
 raised:{label:"Total Raised",sentence:v=>`We've raised ${v.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})} so far.`,icon:HandCoins},
 print:{label:"Campaign Materials Available",sentence:v=>`${v.toLocaleString()} signs, literature, and other campaign materials are currently on hand.`,icon:Printer},
 financeCalls:{label:"Finance Outreach",sentence:v=>`${v.toLocaleString()} finance outreach contacts have been worked.`,icon:Phone},
 outreachCalls:{label:"Voter Outreach",sentence:v=>`${v.toLocaleString()} voter outreach contacts have been worked.`,icon:Megaphone}
};

export default function CampaignDirectoryPage() {
 const [state,setState]=useState("");
 const [office,setOffice]=useState<Office|"">("");
 const [candidate,setCandidate]=useState("");
 const [selected,setSelected]=useState<Campaign|null>(null);
 const [campaigns,setCampaigns]=useState<Campaign[]>([]);
 const [campaignsLoading,setCampaignsLoading]=useState(true);
 const [campaignsError,setCampaignsError]=useState("");
 const [directLinkHandled,setDirectLinkHandled]=useState(false);

 useEffect(()=>{
  let active=true;
  async function loadCampaigns(){
   try{
    setCampaignsLoading(true);
    setCampaignsError("");
    const response=await fetch("/api/public-portal/campaigns",{method:"GET",cache:"no-store"});
    const data=await response.json().catch(()=>null);
    if(!response.ok||data?.success!==true||!Array.isArray(data?.campaigns)){
     throw new Error(data?.error||"Failed to load public campaigns.");
    }
    if(active)setCampaigns(data.campaigns as Campaign[]);
   }catch(error:any){
    if(active)setCampaignsError(error?.message||"Failed to load public campaigns.");
   }finally{
    if(active)setCampaignsLoading(false);
   }
  }
  loadCampaigns();
  return()=>{active=false;};
 },[]);

 useEffect(()=>{
  if(campaignsLoading||directLinkHandled)return;

  const campaignId=new URLSearchParams(window.location.search).get("campaign");
  setDirectLinkHandled(true);

  if(!campaignId)return;

  const directCampaign=campaigns.find(c=>c.id===campaignId);
  if(!directCampaign)return;

  setState(directCampaign.state);
  setOffice(directCampaign.office);
  setCandidate(directCampaign.id);
  setSelected(directCampaign);
 },[campaigns,campaignsLoading,directLinkHandled]);

 const stateCampaigns=useMemo(()=>campaigns.filter(c=>c.state===state),[campaigns,state]);
 const availableStates=useMemo(()=>states.filter(s=>campaigns.some(c=>c.state===s)),[campaigns]);
 const availableOffices=useMemo(()=>offices.filter(o=>stateCampaigns.some(c=>c.office===o)),[stateCampaigns]);
 const availableCampaigns=useMemo(()=>stateCampaigns.filter(c=>!office||c.office===office),[stateCampaigns,office]);

 const openCampaign=()=>{
  const c=availableCampaigns.find(x=>x.id===candidate);
  if(!c)return;
  setSelected(c);
  const url=new URL(window.location.href);
  url.searchParams.set("campaign",c.id);
  window.history.replaceState(null,"",`${url.pathname}${url.search}${url.hash}`);
 };

 const closeCampaign=()=>{
  setSelected(null);
  const url=new URL(window.location.href);
  url.searchParams.delete("campaign");
  window.history.replaceState(null,"",`${url.pathname}${url.search}${url.hash}`);
 };

 return <main className="relative min-h-screen overflow-hidden bg-[#07111F] text-white">
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
   <div className="absolute left-[-160px] top-[-160px] h-[520px] w-[520px] rounded-full bg-violet-700/20 blur-3xl"/>
   <div className="absolute bottom-[-180px] right-[-160px] h-[560px] w-[560px] rounded-full bg-blue-600/20 blur-3xl"/>
   <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",backgroundSize:"80px 80px"}}/>
  </div>

  <div className="relative z-10 mx-auto min-h-screen max-w-[1600px] px-6 py-8 lg:px-12">
   <header className="flex items-center justify-between gap-6">
    <Link href="/" className="inline-flex items-center transition hover:opacity-90">
     <img src="/aether-logo-full.png" alt="Aether OS" className="h-[150px] w-auto object-contain drop-shadow-[0_0_45px_rgba(139,92,246,0.45)] sm:h-[180px]"/>
    </Link>
    <Link href="/" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-white/[0.08]">
     <ArrowLeft className="h-4 w-4"/><span>Back to Aether</span>
    </Link>
   </header>

   <section className="mx-auto max-w-6xl pb-24 pt-4 text-center lg:pt-8">
    <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300"><Building2 className="h-3.5 w-3.5"/>Public Campaign Directory</div>
    <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-[78px]">See campaigns<br/>in motion.</h1>
    <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">Explore public campaign activity shared voluntarily by campaigns using Aether. Campaigns control whether they appear here and which activity they choose to publish.</p>

    <div className="mx-auto mt-12 max-w-5xl rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-5 text-left shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7 lg:p-8">
     <div className="mb-7 flex items-start gap-4">
      <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-300"><Search className="h-5 w-5"/></div>
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Find a campaign</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Choose a state, office, and campaign.</h2></div>
     </div>

     <div className="grid gap-5 lg:grid-cols-3">
      <label><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">State</span>
       <select value={state} onChange={e=>{setState(e.target.value);setOffice("");setCandidate("");}} className="h-14 w-full rounded-2xl border border-white/15 bg-[#0B1629] px-4 text-sm font-semibold text-white outline-none focus:border-violet-400">
        <option value="">{campaignsLoading?"Loading campaigns...":"Select state"}</option>{availableStates.map(s=><option key={s}>{s}</option>)}
       </select>
      </label>
      <label><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Office</span>
       <select value={office} disabled={!state} onChange={e=>{setOffice(e.target.value as Office|"");setCandidate("");}} className="h-14 w-full rounded-2xl border border-white/15 bg-[#0B1629] px-4 text-sm font-semibold text-white outline-none disabled:opacity-40 focus:border-violet-400">
        <option value="">Select office</option>{availableOffices.map(o=><option key={o}>{o}</option>)}
       </select>
      </label>
      <label><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Candidate</span>
       <select value={candidate} disabled={!state||!office} onChange={e=>setCandidate(e.target.value)} className="h-14 w-full rounded-2xl border border-white/15 bg-[#0B1629] px-4 text-sm font-semibold text-white outline-none disabled:opacity-40 focus:border-violet-400">
        <option value="">Select candidate</option>{availableCampaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
       </select>
      </label>
     </div>

     <button type="button" disabled={!candidate} onClick={openCampaign} className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-8 py-5 text-sm font-black uppercase tracking-[0.08em] text-white shadow-2xl shadow-violet-950/40 transition hover:from-violet-400 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-40 sm:text-base">View Campaign<ChevronRight className="h-5 w-5"/></button>
     {campaignsError&&<p className="mt-5 text-center text-xs font-semibold leading-5 text-rose-300">{campaignsError}</p>}
     <p className="mt-5 text-center text-xs leading-5 text-slate-500">Only campaigns that have enabled their Aether Public Campaign Portal appear in this directory.</p>
    </div>

    <div className="mx-auto mt-10 max-w-5xl rounded-[2rem] border border-violet-400/20 bg-gradient-to-r from-violet-500/10 via-white/[0.03] to-blue-500/10 px-7 py-7 text-left shadow-xl shadow-black/10 backdrop-blur-xl sm:px-9">
     <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Campaign-controlled transparency</p><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">Aether provides the infrastructure. Each participating campaign chooses which aggregate activity metrics and campaign links are visible to the public.</p></div><Globe2 className="h-10 w-10 shrink-0 text-violet-300"/></div>
    </div>
   </section>
  </div>

  {selected&&<div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-4 backdrop-blur-md sm:py-6 lg:items-center" onClick={closeCampaign}>
   <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl rounded-[1.5rem] border border-violet-400/25 bg-[#0B1629] p-4 text-left shadow-[0_30px_120px_rgba(0,0,0,0.7)] sm:p-5" onClick={e=>e.stopPropagation()}>
    <button type="button" onClick={closeCampaign} className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]" aria-label="Close"><X className="h-5 w-5"/></button>
    <div className="pr-14"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Public Campaign Portal</p><h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">{selected.name}</h2><p className="mt-2 text-sm font-medium text-slate-400">{selected.office}{selected.district?` • ${selected.district}`:""} • {selected.state}</p></div>
    <div className="mt-4 grid gap-2.5 md:grid-cols-2">
     {(Object.entries(selected.metrics) as [MetricKey,number][]).map(([key,value])=>{const d=metricDetails[key];const Icon=d.icon;return <div key={key} className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-3.5"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/10 p-2 text-violet-300"><Icon className="h-4 w-4"/></div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{d.label}</p></div><p className="mt-2.5 text-sm font-semibold leading-5 text-white sm:text-base">{d.sentence(value)}</p></div>})}
    </div>
    {(selected.website||selected.donateUrl)&&<div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
     {selected.website&&<a href={selected.website} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white hover:bg-white/[0.08]">Campaign Website<ExternalLink className="h-4 w-4"/></a>}
     {selected.donateUrl&&<a href={selected.donateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-violet-300/60 bg-gradient-to-b from-violet-500 to-violet-800 px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white">Donate<ExternalLink className="h-4 w-4"/></a>}
    </div>}
    <p className="mt-4 text-center text-[10px] leading-4 text-slate-500">Activity shown here is published voluntarily by this campaign through its Aether Public Campaign Portal settings.</p>
   </div>
  </div>}
 </main>;
}
