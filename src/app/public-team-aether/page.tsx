// Public Team Aether Page
"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";

export default function PublicTeamAetherPage(){
  const [form,setForm]=useState({name:"",email:"",organization:"",phone:"",message:""});
  const [sending,setSending]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState("");
  const [ceoClicks,setCeoClicks]=useState(0);
  const [ceoSecretOpen,setCeoSecretOpen]=useState(false);

  function handleCeoSecret(){
    setCeoClicks(current => {
      const next = current + 1;
      if(next >= 6){
        setCeoSecretOpen(true);
        return 0;
      }
      return next;
    });
  }

  function handleChange(e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>){
    const {name,value}=e.target;
    setForm(f=>({...f,[name]:value}));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>){
    e.preventDefault();
    setSending(true);
    setError("");
    try{
      const res=await fetch("/api/contact",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({type:"contact",...form})
      });
      const data=await res.json();
      if(!res.ok||!data.success) throw new Error();
      setSubmitted(true);
    }catch{
      setError("Unable to send your request. Please try again.");
    }finally{
      setSending(false);
    }
  }
return (
<main className="relative min-h-screen overflow-hidden bg-[#07111F] text-white">
<div className="absolute inset-0">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_45%)]"></div>
<div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_40%)]"></div>
<div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07111F]/40 to-[#07111F]"></div>
</div>
<div className="relative mx-auto max-w-5xl px-6 py-20"><Link href="/" className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10"><span>←</span><span>Back to Landing Page</span></Link><div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm p-10 shadow-2xl shadow-violet-900/10">
<div className="mb-3 text-xs uppercase tracking-[0.35em] text-violet-300">About Us</div>
<h1 className="text-5xl font-black">Team Aether</h1><p className="mt-6 text-lg text-slate-300">Built by campaign people. Built for campaign people.</p><div className="mt-10 space-y-4 text-slate-300 leading-8">
<p>Campaigns are powered by people most voters will never meet.</p>
<p>The volunteers knocking on doors after work.</p>
<p>The finance teams making one more call before heading home.</p>
<p>The field organizers chasing moving targets.</p>
<p>The digital teams responding to today's news before tomorrow arrives.</p>
<p>The staff who spend twelve-hour days supporting candidates, donors, volunteers, and communities.</p>
<p>Those are the people we built Aether for.</p>
<p>Not because campaigns needed another piece of software.</p>
<p>Because the people behind campaigns deserved something better.</p>
</div></div><section className="mt-24 space-y-20">

<div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm p-10"><div className="mb-3 text-xs uppercase tracking-[0.35em] text-violet-300">Why We Exist</div><h2 className="text-3xl font-bold">Our Mission</h2>
  <div className="mt-6 max-w-3xl space-y-5 text-slate-300 leading-8">
    <p>After spending twelve-hour days supporting candidates, donors, volunteers, and communities, the last thing campaign workers should have to do is spend their evenings wrestling with spreadsheets, disconnected systems, or software that creates more questions than answers.</p>
    <p>Campaign work is already complicated. The technology supporting it shouldn't be.</p>
  </div>
  <div className="mt-8 rounded-3xl border border-violet-500/30 bg-violet-500/10 p-8 text-center">
    <p className="text-2xl font-bold text-violet-300">Deliver simplicity where campaigns have grown accustomed to complexity.</p>
    <p className="mt-3 text-slate-300">Not for the people standing behind the podium.<br/>For the people standing behind the campaign.</p>
  </div>
</div>

<div>
  <h2 className="text-3xl font-bold">How Team Aether Works</h2>
  <div className="mt-8 grid gap-6 md:grid-cols-3">
    <div className="rounded-2xl bg-white/5 p-6 border border-white/10"><h3 className="font-bold text-violet-300">The Architect</h3><p className="mt-2 text-slate-300">Imagines what could be.</p></div>
    <div className="rounded-2xl bg-white/5 p-6 border border-white/10"><h3 className="font-bold text-violet-300">The Operator</h3><p className="mt-2 text-slate-300">Grounds great ideas.</p></div>
    <div className="rounded-2xl bg-white/5 p-6 border border-white/10"><h3 className="font-bold text-violet-300">The Mystic</h3><p className="mt-2 text-slate-300">Reminds us why it matters.</p></div>
  </div>
  <p className="mt-8 max-w-3xl text-slate-300 leading-8">None of us could build Aether alone. Every feature, every conversation, and every direction Aether takes comes from three different ways of looking at the same problem. We don't always agree. That's exactly why it works.</p><p className="mt-6 max-w-3xl text-slate-300 leading-8"><strong>The Architect</strong> asks, <em>"What if?"</em> <strong>The Operator</strong> asks, <em>"How?"</em> <strong>The Mystic</strong> asks, <em>"Who are we building this for?"</em> Together, that's Team Aether.</p>
</div>

<div className="space-y-12">
  <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
    <h2 className="text-3xl font-bold">The Architect</h2>
    <p className="mt-4 text-slate-300 leading-8">Every team needs someone willing to ask impossible questions.<br/><br/>The Architect lives somewhere between systems thinking and relentless curiosity. He sees complexity and immediately starts pulling it apart—not because building software is particularly interesting on its own, but because there has to be a simpler way for people to work.<br/><br/>Every feature eventually comes back to one question: <strong>Does this actually make someone's day easier?</strong><br/><br/>That instinct is what turned conversations into Aether. Problems become diagrams. Diagrams become systems. Systems get torn apart and rebuilt until the technology starts disappearing behind the work it's supposed to support.<br/><br/>Of course, focus has never exactly been his defining characteristic.<br/><br/>One problem can become three ideas, two impossible thought experiments, and an entirely unrelated business concept before anyone realizes what happened. The Operator and Mystic have become remarkably good at dragging him back to Earth.<br/><br/>But that curiosity is also the point.<br/><br/>The Architect's job isn't simply to build what already exists. It's to keep asking whether the thing everyone accepts as normal could work completely differently.</p>
    <blockquote className="mt-6 border-l-4 border-violet-400 pl-5 italic text-lg">"ITS ALL ABOUT THE LOOPS"</blockquote>
  </div>

  <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
    <h2 className="text-3xl font-bold">The Operator</h2>
    <p className="mt-4 text-slate-300 leading-8">Every ambitious idea eventually meets reality.<br/><br/>That's where The Operator shines.<br/><br/>He's the person who turns momentum into execution—the one willing to take a room full of ideas, arguments, possibilities, and occasionally complete insanity and figure out what actually needs to happen next.<br/><br/>He keeps us moving when the exciting part is over. He handles the details nobody celebrates, works through the operational headaches nobody anticipated, and asks the practical questions that turn an idea into something capable of surviving outside the room where it was created.<br/><br/>While The Architect is pulling systems apart and The Mystic is pushing ideas somewhere unexpected, The Operator is constantly measuring those ideas against reality: <strong>Can we actually do this? What does it require? What happens next?</strong><br/><br/>That doesn't make him the person who says no.<br/><br/>More often, he's the person who figures out how to turn an unreasonable <strong>yes</strong> into a workable plan.<br/><br/>Great ideas don't become products because they're exciting.<br/><br/>They become products because someone creates the structure that allows them to become real.</p>
    <blockquote className="mt-6 border-l-4 border-violet-400 pl-5 italic text-lg">"Can the two of you idiots just focus on one thing... just one thing for more than five minutes? Please?! We're trying to write our mission statement here!"</blockquote>
  </div>

  <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
    <h2 className="text-3xl font-bold">The Mystic</h2>
    <p className="mt-4 text-slate-300 leading-8">Technology has never been the point.<br/><br/>The Mystic brings a different kind of intelligence to Team Aether—the instinct to look past the system and think about the person on the other side of it.<br/><br/>He's endlessly creative, relentlessly curious, and usually the first person willing to take an idea somewhere none of us expected it to go. Some of those ideas are ridiculous. Some become part of Aether. More often than we'd probably like to admit, they're both.<br/><br/>While The Architect asks what could exist and The Operator figures out how to make it real, The Mystic keeps pulling the conversation back to experience: <strong>How does this feel? Will people understand it? Will they actually want to use it?</strong><br/><br/>That perspective has shaped more of Aether than any technical specification ever could.<br/><br/>Because building something that works is only part of the job.<br/><br/>Building something people can connect with is what makes it matter.</p>
    <blockquote className="mt-6 border-l-4 border-violet-400 pl-5 italic text-lg">"Okay, but hear me out... what if we made it actually fun?"</blockquote>
  </div>
</div>

<div>
  <h2 className="text-3xl font-bold">What We Believe</h2>
  <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
    <div className="rounded-2xl bg-white/5 p-5">Campaign workers deserve better technology.</div>
    <div className="rounded-2xl bg-white/5 p-5">Simplicity is harder to build than complexity.</div>
    <div className="rounded-2xl bg-white/5 p-5">Software should reduce stress, not create it.</div>
    <div className="rounded-2xl bg-white/5 p-5">Every department deserves the same picture.</div>
    <div className="rounded-2xl bg-white/5 p-5">Trust is earned, never assumed.</div>
    <div className="rounded-2xl bg-white/5 p-5">Great ideas survive good arguments.</div>
  </div>
</div>

<div className="rounded-3xl border border-white/10 bg-white/5 p-10">
<h2 className="text-3xl font-bold">Meet the Founder</h2>
<p className="mt-2 text-violet-300 font-semibold">Tyler Tannehill • Founder &amp; <span onClick={handleCeoSecret}>CEO</span></p>
<div className="mt-6 space-y-5 max-w-3xl text-slate-300 leading-8">
<p>After years of managing large-scale technology operations—and spending enough time around campaigns to see how disconnected the technology had become—I couldn't shake one simple thought: <strong>Politics deserves better technology than this.</strong></p>
<p>That thought became conversations with a Mystic and an Operator who challenged every assumption until those conversations became Aether.</p>
<p>Today, I'm less interested in building software than I am in building something that gives campaign teams one less thing to worry about. If we can remove a little friction from their day and give them more time to focus on people instead of paperwork, then we're building the right thing.</p>
</div>
<div className="mt-8 rounded-2xl bg-violet-500/10 p-6 text-center text-xl font-bold text-violet-300">If Aether makes someone's twelve-hour day feel like ten… we've done our job.</div>
</div>

<div className="space-y-10">
  <div><h2 className="text-3xl font-bold">Building With Campaigns</h2><p className="mt-4 max-w-3xl text-slate-300 leading-8">Every campaign teaches us something. Every conversation changes our perspective. We're not building software for campaigns—we're building it alongside them.</p></div>
  <div><h2 className="text-3xl font-bold">Beyond the Software</h2><p className="mt-4 max-w-3xl text-slate-300 leading-8">Long after elections are over, the late nights, impossible deadlines, and friendships are what remain. We want Aether to honor the people behind those stories.</p></div>
  <div className="rounded-3xl border border-violet-500/30 bg-violet-500/10 p-10 text-center">
    <h2 className="text-3xl font-bold">Looking Forward</h2>
    <p className="mt-6 text-2xl font-bold text-violet-300">Make campaign work a little simpler<br/>for the people who make campaigns possible.</p>
  </div>
</div>


<div className="rounded-3xl bg-white/5 p-10 text-center">
<h2 className="text-3xl font-bold">Thanks for taking the time to get to know us.</h2>
<p className="mt-4 text-slate-300">We hope we get the chance to get to know you, too.</p>
<p className="mt-4 text-slate-400">Whether you're running for city council, managing a statewide campaign, or simply curious about what we're building, we'd love to have a conversation.</p>
<div className="mt-12 mb-8 flex justify-center">
<Link href="/explore-abe" className="rounded-xl bg-violet-600 px-6 py-3 font-bold">Request a Demo</Link>
</div>


<div id="contact-team-aether" className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm p-10">
  <div className="mb-3 text-xs uppercase tracking-[0.35em] text-violet-300">Contact</div>
  <h2 className="text-4xl font-black">Contact Team Aether</h2>
  <p className="mt-5 max-w-3xl text-slate-300 leading-8">
    Have a general question, partnership inquiry, media request, or simply want to learn more about Aether?
  </p>
  <p className="mt-3 text-slate-300">
    We'd love to hear from you.
  </p>

  {submitted ? (
    <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-green-200">
      <h3 className="font-bold">Message Received</h3>
      <p className="mt-2">Thank you. Team Aether will be in touch.</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
      <input required name="name" value={form.name} onChange={handleChange} placeholder="Name *" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
      <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email *" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
      <input name="organization" value={form.organization} onChange={handleChange} placeholder="Organization" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
      <textarea name="message" value={form.message} onChange={handleChange} rows={5} placeholder="Message" className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"/>
      {error && <p className="md:col-span-2 text-red-300">{error}</p>}
      <div className="md:col-span-2">
        <button type="submit" disabled={sending} className="rounded-xl bg-violet-600 px-6 py-3 font-bold disabled:opacity-60">
          {sending ? "Sending..." : "Send Message"}
        </button>
        <p className="mt-3 text-xs text-slate-400">* Required fields</p>
      </div>
    </form>
  )}
</div>

</div>

</section>

{ceoSecretOpen && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-6 backdrop-blur-sm"
    onClick={() => setCeoSecretOpen(false)}
  >
    <div
      role="dialog"
      aria-modal="true"
      className="w-full max-w-lg rounded-[2rem] border border-violet-400/30 bg-[#0B1629] p-8 text-center shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="text-xl font-bold leading-8 text-white">
        I'm making my life mine again.
      </p>

      <audio
        className="mx-auto mt-8 w-full"
        controls
        preload="metadata"
        src="/audio/mine-again.m4a"
      >
        Your browser does not support audio playback.
      </audio>

      <button
        type="button"
        onClick={() => setCeoSecretOpen(false)}
        className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300"
      >
        Close
      </button>
    </div>
  </div>
)}

</div></main>)}