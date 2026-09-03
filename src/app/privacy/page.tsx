import Link from "next/link";

const sections = [
  {
    title: "1. Information We Collect",
    body: [
      "We collect information necessary to operate and support Aether. Depending on how your organization uses the Services, this may include account information such as names, email addresses, roles, departments, organization memberships, authentication identifiers, and account status; campaign and organization information; contacts, lists, notes, workflows, and operational records; files and data your organization uploads or imports; information received through integrations you choose to connect; technical and usage information used to operate, secure, troubleshoot, and improve the Services; and information you provide when communicating with Team Aether.",
      "The specific information processed by Aether depends on the features your organization chooses to use and the information its authorized users choose to provide."
    ]
  },
  {
    title: "2. How We Use Information",
    body: [
      "We use information to provide and administer the Services; authenticate users; maintain campaign and organization context; process authorized imports and integrations; support campaign workflows; provide customer support; diagnose technical issues; maintain security and reliability; improve Aether; enforce our agreements; and comply with applicable legal obligations.",
      "We do not sell campaign data. We do not treat campaign, contact, donor, supporter, volunteer, or operational data entrusted to Aether as an advertising product."
    ]
  },
  {
    title: "3. Data Ownership",
    body: [
      "Your organization retains ownership of the campaign and operational data it provides to Aether. Aether receives only the rights reasonably necessary to host, process, transmit, secure, back up, and otherwise handle that information for the purpose of providing and supporting the Services.",
      "Authorized users are responsible for ensuring that their organization has the right to collect, upload, import, use, and instruct Aether to process the information they place in the Services."
    ]
  },
  {
    title: "4. Organization Access and User Permissions",
    body: [
      "Aether is designed for organizations whose authorized users may have different roles, departments, and permissions. Information entered into an organization may be accessible to other authorized users of that organization according to the organization's configuration and Aether's access controls. Organization administrators are responsible for managing appropriate user access."
    ]
  },
  {
    title: "5. Integrations and Third-Party Services",
    body: [
      "Aether may allow organizations to connect third-party platforms or services. When an authorized user enables an integration, Aether may receive, transmit, or process information as necessary to perform the requested connection or feature. The information handled depends on the integration and the permissions authorized by the user or organization.",
      "Third-party services operate under their own terms and privacy policies. Aether does not control their independent privacy practices, availability, or security. Disconnecting an integration stops future activity through that connection to the extent supported by Aether, but does not necessarily delete information previously imported into Aether or information retained independently by the third-party provider."
    ]
  },
  {
    title: "6. Google User Data",
    body: [
      "When an organization connects a supported Google service, Aether accesses and uses Google user data only as necessary to provide functionality requested and authorized by the user. Access is limited by the permissions granted through Google's authorization process.",
      "Aether's use and transfer of information received from Google APIs will adhere to applicable Google API Services User Data Policy requirements, including applicable Limited Use requirements."
    ]
  },
  {
    title: "7. Artificial Intelligence and External AI Services",
    body: [
      "Aether may provide features, links, or workflows involving artificial intelligence. Where a feature sends information to an external AI provider, users should review the information being shared and the provider's applicable terms and privacy practices before proceeding. Users are responsible for ensuring they have the right to disclose information they choose to send to an external service.",
      "Links or buttons that open an independent AI service do not, by themselves, give that service access to campaign data stored inside Aether."
    ]
  },
  {
    title: "8. Service Providers and Disclosure of Information",
    body: [
      "We may use service providers and infrastructure partners to help host, secure, maintain, communicate about, and operate the Services. These providers may process information on our behalf only as reasonably necessary to perform those functions.",
      "We may also disclose information when reasonably necessary to comply with applicable law or valid legal process; protect the rights, safety, or security of Aether, our users, or others; investigate fraud, abuse, or security incidents; enforce our agreements; or complete a corporate transaction such as a merger, acquisition, financing, reorganization, or sale of relevant business assets, subject to applicable law."
    ]
  },
  {
    title: "9. Data Retention, Export, and Account Closure",
    body: [
      "Aether is built around the principle that your data is your data. Organizations may use available export tools to retrieve their data. Following cancellation or completion of yearly usage, Aether may retain organization data for up to 60 days to allow for export, reactivation, support, or orderly account closure, unless a longer period is required by law or specifically arranged with the organization.",
      "Where offered, an organization may elect a separate paid data-storage option after its primary subscription or yearly usage ends. Information may also remain temporarily in backups, logs, or disaster-recovery systems until those systems cycle through their normal retention processes."
    ]
  },
  {
    title: "10. Security",
    body: [
      "We use reasonable administrative, technical, and organizational safeguards designed to protect information against unauthorized access, loss, misuse, alteration, or disclosure. Security is a shared responsibility. Users should protect their credentials, use appropriate access controls, and promptly notify Team Aether of suspected unauthorized access.",
      "No internet-connected service, transmission method, or storage system can guarantee absolute security. Aether therefore cannot promise that information will never be accessed, used, or disclosed in an unauthorized manner."
    ]
  },
  {
    title: "11. Cookies and Similar Technologies",
    body: [
      "Aether may use cookies, local storage, session technologies, and similar mechanisms reasonably necessary for authentication, security, preferences, application functionality, and performance. If Aether introduces additional analytics, advertising, or tracking technologies, this Privacy Policy may be updated to describe those practices."
    ]
  },
  {
    title: "12. Children's Privacy",
    body: [
      "The Services are designed for campaign and organizational use and are not directed to children under 13. Aether does not knowingly seek to collect personal information directly from children under 13 through account registration. If you believe a child has provided personal information directly to Aether inappropriately, please contact Team Aether."
    ]
  },
  {
    title: "13. Campaign and Regulatory Responsibilities",
    body: [
      "Campaigns and political organizations may be subject to federal, state, local, or other requirements concerning voter, donor, supporter, employee, volunteer, financial, communications, and campaign records. Each organization is responsible for determining the laws, regulations, reporting obligations, consent requirements, and retention rules that apply to its activities. Aether provides operational software and does not replace an organization's legal, compliance, accounting, or campaign-finance advisers."
    ]
  },
  {
    title: "14. Changes to This Privacy Policy",
    body: [
      "We may update this Privacy Policy as Aether evolves, our practices change, or legal requirements develop. When we make changes, we will update the Last Updated date above. Material changes may also be communicated through the Services or other reasonable means when appropriate."
    ]
  },
  {
    title: "15. Questions and Privacy Requests",
    body: [
      "If you have questions about this Privacy Policy, want to request access to or deletion of information associated with your account or organization, or need help understanding how Aether handles data, please contact Team Aether. Requests involving organization-controlled campaign data may require verification or coordination with the organization's administrator."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111F] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(7,17,31,0.35),transparent)]" />

      <div className="relative mx-auto max-w-4xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/10">
          <span>←</span><span>Back to Landing Page</span>
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl">
          <h1 className="text-5xl font-black tracking-tight">Privacy Policy</h1>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Last Updated: September 3, 2026</p>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Your campaign&apos;s data belongs to your campaign. Always. Aether exists to help campaigns organize, execute, and operate more effectively—not to sell or monetize the information entrusted to us.
          </p>
          <p className="mt-4 leading-8 text-slate-300">
            This Privacy Policy explains how Aether Systems LLC (&quot;Aether,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, stores, and protects information when you use Aether&apos;s websites, applications, Campaign Operating System, integrations, and related services (collectively, the &quot;Services&quot;).
          </p>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-bold">{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-4 leading-8 text-slate-300">{paragraph}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-6">
            <p className="leading-7 text-slate-300">
              <strong className="text-white">Our operating principle:</strong> Aether exists to help campaigns use their information—not to turn their information into somebody else&apos;s product.
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <Link href="/public-team-aether#contact-team-aether" className="rounded-xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-500">
              Contact Team Aether
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
