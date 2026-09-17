export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <a
          href="/"
          className="mb-10 inline-block text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Aether
        </a>

        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Aether Systems LLC
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Aether Mobile Data Deletion
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-300">
            Aether Mobile is a companion application for the Aether campaign
            operating system. Users may request deletion of their account and
            associated user data using the process below.
          </p>
        </div>

        <div className="space-y-10 text-slate-300">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              Requesting deletion
            </h2>

            <p className="leading-7">
              To request deletion of your Aether Mobile account and associated
              user data, contact your campaign or organization administrator.
              Authorized administrators can remove users from their organization
              through Aether&apos;s administrative tools.
            </p>

            <p className="mt-4 leading-7">
              You may also submit a deletion request directly to Aether Systems
              at{" "}
              <a
                href="mailto:team@aetheros.pro?subject=Aether%20Mobile%20Data%20Deletion%20Request"
                className="font-medium text-blue-400 underline underline-offset-4 hover:text-blue-300"
              >
                team@aetheros.pro
              </a>
              . Please use the subject line &quot;Aether Mobile Data Deletion
              Request&quot; and include the email address associated with your
              Aether account so that we can identify the appropriate account and
              organization.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              What is deleted
            </h2>

            <p className="leading-7">
              When an authorized account deletion request is completed, Aether
              removes the user&apos;s account and associated user access from
              the applicable organization. Campaign and organization data may
              be managed separately by the organization that controls that
              campaign workspace.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              Campaign data retention
            </h2>

            <p className="leading-7">
              Following the end of the applicable campaign or service period,
              campaign data is retained for 60 days and is then automatically
              deleted in accordance with Aether&apos;s data-retention policy.
            </p>

            <p className="mt-4 leading-7">
              Certain information may be retained when reasonably necessary to
              comply with legal obligations, resolve disputes, maintain
              security, prevent fraud or abuse, or enforce applicable
              agreements.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              Questions
            </h2>

            <p className="leading-7">
              For questions about account or data deletion, contact Aether
              Systems at{" "}
              <a
                href="mailto:team@aetheros.pro"
                className="font-medium text-blue-400 underline underline-offset-4 hover:text-blue-300"
              >
                team@aetheros.pro
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mt-16 border-t border-slate-800 pt-8 text-sm text-slate-500">
          © {new Date().getFullYear()} Aether Systems LLC. All rights reserved.
        </footer>
      </div>
    </main>
  );
}