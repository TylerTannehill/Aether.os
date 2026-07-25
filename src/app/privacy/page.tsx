import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111F] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(7,17,31,0.35),transparent)]" />

      <div className="relative mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10"
        >
          <span>←</span>
          <span>Back to Landing Page</span>
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl">
          <h1 className="text-5xl font-black tracking-tight">Privacy</h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Your campaign's data belongs to your campaign. Always.
            Aether exists to help campaigns organize, execute, and operate more
            effectively—not to sell, share, or monetize the information entrusted to us.
          </p>

          <div className="mt-12 space-y-10">
            <section>
              <h2 className="text-2xl font-bold">What We Collect</h2>
              <p className="mt-4 leading-8 text-slate-300">
                We collect the information necessary to operate Aether, including account
                details, campaign information, contacts, uploaded data, and platform usage
                information that helps us improve reliability and performance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">How We Use It</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Your information is used to provide Aether's services, support campaign
                operations, improve the platform, maintain security, and respond to support
                requests. We do not sell your campaign data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Data Ownership</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Your campaign retains ownership of its data. Aether stores and processes
                information only to provide the services you choose to use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Security</h2>
              <p className="mt-4 leading-8 text-slate-300">
                We use reasonable administrative and technical safeguards to help protect
                campaign information. While no online system can guarantee absolute security,
                protecting campaign data is a responsibility we take seriously.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Questions</h2>
              <p className="mt-4 leading-8 text-slate-300">
                If you have questions about this Privacy Policy or how Aether handles data,
                please contact Team Aether.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
