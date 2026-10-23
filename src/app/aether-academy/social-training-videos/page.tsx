import Link from "next/link";
import Image from "next/image";

// Add the published YouTube IDs here when the two walkthroughs are ready.
const videos = [
  { id: "members", title: "Aether Social for Members", subtitle: "Your professional life. Your personal life. Your choice.", description: "A guided introduction to Aether Social for everyday members—from creating your profile and sharing posts to managing personal connections and direct messages.", topics: ["Professional and personal profiles", "Feeds, posts, photos, and conversations", "Personal-network access and DM permissions", "Discovering people and professional opportunities"], videoId: "s73J91F-HK8", guide: "/aether-academy/social-academy#welcome", guideLabel: "Explore the Member Guides" },
  { id: "employers", title: "Aether Social for Employers", subtitle: "Find people. Share opportunities. Grow your reach.", description: "A practical overview of Aether Social for organizations: employer access, publishing and managing jobs, Needle and Haystack plans, and available advertising placements.", topics: ["Employer login and organization access", "Creating and managing job postings", "Needle and Haystack employer plans", "Professional-feed promotions and advertising options"], videoId: "BDtsnAZYf_A", guide: "/aether-academy/social-academy#jobs", guideLabel: "Explore the Employer Guides" },
] as const;

export default function SocialTrainingVideosPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111F] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_45%)]" />

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-6 lg:pt-8">
        <div className="text-center">
          <Image
            src="/aether-logo-full.png"
            alt="Aether.OS"
            width={420}
            height={140}
            priority
            className="mx-auto h-auto w-72 max-w-full object-contain sm:w-80"
          />
          <div className="mt-1 inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-violet-200 sm:text-sm">
            Social Academy · Training Videos
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Learn Aether Social from Team Aether.
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            Two straightforward walkthroughs: one for members and one for employers. Choose the experience that fits you, then explore the written Academy for individual features and detailed answers.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <Link href="/aether-academy" className="inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-200 transition hover:border-violet-300 hover:bg-violet-400/15">
            Back to Academy
          </Link>
        </div>

        <nav aria-label="Social Academy navigation" className="mt-7 flex justify-center">
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl border border-violet-400/35 bg-white/5 p-1.5">
            <Link href="/aether-academy/social-academy" className="rounded-xl px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 sm:text-base">
              Learning Library — Social
            </Link>
            <span aria-current="page" className="rounded-xl bg-violet-600 px-5 py-3 text-center text-sm font-semibold text-white sm:text-base">
              Training Videos — Social
            </span>
          </div>
        </nav>

        <div className="mt-10 grid gap-6 lg:gap-8">
          {videos.map((video) => (
            <section key={video.id} id={video.id} className="scroll-mt-28 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl lg:rounded-2xl lg:p-6">
              <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-300">{video.id === "members" ? "For People" : "For Employers"}</span>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{video.title}</h2>
              <p className="mt-2 text-lg font-semibold text-violet-200">{video.subtitle}</p>
              <p className="mt-4 max-w-4xl leading-8 text-slate-300">{video.description}</p>
              <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black lg:rounded-xl">
                {video.videoId ? (
                  <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${video.videoId}`} title={`${video.title} — Aether Social Training`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">Video Coming Soon</span>
                    <p className="max-w-md text-sm leading-6 text-slate-400">Team Aether is preparing this overview. The written guides are available now.</p>
                  </div>
                )}
              </div>
              <div className="mt-7 rounded-2xl border border-violet-400/20 bg-violet-400/[0.06] p-6">
                <h3 className="text-lg font-bold">What this walkthrough covers</h3>
                <ul className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  {video.topics.map((topic) => <li key={topic} className="flex gap-2"><span className="text-violet-400">•</span><span>{topic}</span></li>)}
                </ul>
              </div>
              <div className="mt-6">
                <Link href={video.guide} className="inline-flex items-center font-semibold text-violet-300 transition hover:text-violet-200">{video.guideLabel}</Link>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
