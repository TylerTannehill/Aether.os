import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

const videos = [
  ["Welcome to Aether","Learn what Aether is, why it was built, and how campaign teams can use it to simplify daily operations.","welcome-to-aether","lq_qHRNg2RA"],
  ["What is Aether?","Understand what makes Aether different from traditional campaign software and why we describe it as a Campaign Operating System.","what-is-aether","IiAUb7ydSxc"],
  ["Campaign Operating System","Explore how Aether connects every department into one unified platform.","campaign-operating-system","IiAUb7ydSxc"],
  ["Design Philosophy","Discover the principles that guide every decision behind Aether.","design-philosophy","Rn2phdCRsok"],
  ["Honest Abe","Learn how Honest Abe helps campaigns understand operational priorities.","honest-abe","gKmi3P_hUg0"],
  ["Dashboard","Walk through the campaign dashboard and campaign health.","dashboard","XomJlpFgAh0"],
  ["Focus Mode","See how Focus Mode helps teams execute without distractions.","focus-mode","9R6aBnZ7264"],
  ["Aether Mobile","Learn how mobile supports field operations and call time.","aether-mobile"],
  ["Finance","Understand fundraising and finance workflows.","finance","8nai7-Oce_w"],
  ["Field","Learn how Aether supports field operations.","field","cnwBz3s2rwk"],
  ["Outreach","See how campaigns organize outreach.","outreach","aZIyVV1UZIo"],
  ["Digital","Learn how digital efforts fit campaign strategy.","digital","oCmzSlPpxEg"],
  ["Print","Understand print workflows.","print","4AC2pg0tvdw"],
  ["Contacts","Learn why contacts power every department.","contacts","PJzqAhx37E8"],
  ["Lists","Discover how Lists organize campaign work.","lists","YadJGSB7eYw"],
  ["Imports","Learn how to safely import campaign information.","imports","-5XZUQE9lgc"],
  ["Tools","Explore Aether's utility tools.","tools","OEnfNQAvGdo"],
  ["Integrations Hub","Learn how Aether connects with outside services.","integrations-hub","V49h2Q_pzLM"],
  ["Integrations","See connected services in action.","integrations","V49h2Q_pzLM"],
  ["Organizations","Understand campaigns and organizations.","organizations","Rn2phdCRsok"],
  ["Team Management","Learn how leadership manages users.","team-management","ogepSxMbwO8"],
  ["Roles & Permissions","Understand access and permissions.","roles","ogepSxMbwO8"],
  ["Security","Learn about Aether's approach to security.","security","opSLVl_w-8c"],
  ["Privacy","Understand campaign data ownership and privacy.","privacy","VrzJZVwA4SM"],
  ["Frequently Asked Questions","Answers to common campaign questions.","faq","ewar8oYYSwM"],
];

export default function TrainingVideosPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111F] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_45%)]" />

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <Link href="/aether-academy" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:border-violet-400/40">
          ← Back to Aether Academy
        </Link>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-violet-300">
            <PlayCircle className="h-4 w-4" /> Training Videos
          </div>

          <h1 className="mt-8 text-5xl font-black lg:text-7xl">Learn Aether from Team Aether.</h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Every Academy lesson will eventually have a companion walkthrough demonstrating how the
            feature works inside the platform. Videos are currently in production and will be
            published before launch.
          </p>
        </div>

        <div className="mt-20 space-y-8">
          {videos.map(([title, desc, anchor, videoId]) => (
            <section key={anchor} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="mt-4 leading-8 text-slate-300">{desc}</p>

              {videoId ? (
                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <div className="aspect-video">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={`${title} training video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-6 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300">
                  Coming Soon
                </div>
              )}

              <div className="mt-8">
                <Link
                  href={`/aether-academy#${anchor}`}
                  className="inline-flex items-center gap-2 font-semibold text-violet-300 transition hover:text-violet-200"
                >
                  View Related Article <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
