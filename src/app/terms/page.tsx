import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="text-5xl font-black tracking-tight">Terms of Service</h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            These Terms describe the expectations between Team Aether and the campaigns that
            choose to use Aether. Our goal is simple: provide reliable software that helps
            campaigns operate more effectively while treating every organization fairly.
          </p>

          <div className="mt-12 space-y-10">
            <section>
              <h2 className="text-2xl font-bold">Using Aether</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Aether is designed to support lawful political campaign operations. By using
                the platform, you agree to use it responsibly and in accordance with
                applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Accounts</h2>
              <p className="mt-4 leading-8 text-slate-300">
                You are responsible for maintaining the security of your account credentials
                and for activity that occurs within your organization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Your Data</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Your campaign retains ownership of its data. Aether provides the platform used
                to organize and manage that information but does not claim ownership of your
                campaign's content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Acceptable Use</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Do not attempt to compromise platform security, interfere with another
                organization's data, abuse the service, or use Aether for unlawful activity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Platform Availability</h2>
              <p className="mt-4 leading-8 text-slate-300">
                We work hard to provide a reliable service, but maintenance, updates, and
                unexpected interruptions may occasionally occur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Intellectual Property</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Aether, its software, branding, and related materials are the property of
                Aether Systems LLC. Your campaign content remains yours.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Changes</h2>
              <p className="mt-4 leading-8 text-slate-300">
                As Aether continues to evolve, these Terms may be updated to reflect new
                features, services, or legal requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Questions</h2>
              <p className="mt-4 leading-8 text-slate-300">
                If you have questions about these Terms, please contact Team Aether.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
