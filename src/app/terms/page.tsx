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

          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            Last updated: September 3, 2026
          </p>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            These Terms of Service (&quot;Terms&quot;) govern access to and use of Aether&apos;s
            websites, applications, Campaign Operating System, mobile software, integrations,
            and related services (collectively, the &quot;Services&quot;).
          </p>

          <p className="mt-4 leading-8 text-slate-300">
            These Terms form an agreement between Aether Systems LLC (&quot;Aether,&quot;
            &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) and the individual or organization
            accessing or using the Services (&quot;you&quot; or &quot;your&quot;). If you use
            Aether on behalf of a campaign, committee, organization, company, or other entity,
            you represent that you have authority to accept these Terms on its behalf.
          </p>

          <div className="mt-12 space-y-10">
            <section>
              <h2 className="text-2xl font-bold">1. Using Aether</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Aether is designed to support lawful campaign and organizational operations.
                You may use the Services only in compliance with these Terms and applicable
                federal, state, local, and other laws and regulations.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                You are responsible for determining whether Aether is appropriate for your
                organization&apos;s needs and for the decisions, communications, filings,
                expenditures, outreach, field activity, fundraising activity, and other actions
                your organization takes using information maintained or organized through Aether.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">2. Accounts, Organizations, and Authorized Users</h2>
              <p className="mt-4 leading-8 text-slate-300">
                You must provide accurate information when establishing or administering an
                account or organization. You are responsible for protecting account credentials
                and for activity performed through accounts under your control.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Organization administrators are responsible for deciding who may access their
                organization, assigning appropriate roles and permissions, removing access when
                it is no longer appropriate, and ensuring that authorized users comply with
                these Terms. Accounts may not be shared in a manner that defeats Aether&apos;s
                access controls or compromises the security of the Services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">3. Your Data</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Your campaign or organization retains ownership of the data and content it
                provides to Aether. Aether does not claim ownership of your campaign&apos;s
                contacts, lists, notes, files, operational records, or other organization
                content merely because that information is stored or processed through the
                Services.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                You grant Aether the limited rights reasonably necessary to host, process,
                transmit, secure, back up, display, and otherwise handle your data to provide,
                maintain, support, and improve the Services. You represent that you have the
                rights and authority necessary to provide that information to Aether and to
                instruct us to process it.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Our collection, use, retention, and protection of information is also governed
                by our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">4. Data Export, Retention, and Account Closure</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Aether is built around the principle that your data is your data. Where export
                functionality is available, organizations are responsible for exporting and
                preserving information they wish to retain outside Aether.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Following cancellation or completion of yearly usage, Aether may retain
                organization data for up to 60 days to support export, reactivation, customer
                support, or orderly account closure, unless a different period is required by
                law or specifically arranged with the organization. Where offered, an
                organization may elect a separate paid data-storage option after its primary
                subscription or yearly usage ends.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">5. Subscriptions, Fees, and Promotions</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Certain Services require a paid subscription, license, or other fee. Pricing,
                billing periods, included features, and any applicable limits will be presented
                when you purchase or activate the applicable Service. You agree to pay the fees
                associated with the plan or service you select, together with applicable taxes
                or charges.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Promotional pricing, launch specials, trials, discounts, credits, and other
                offers may be subject to additional eligibility requirements, dates, limits, or
                terms disclosed with the offer. Unless expressly stated otherwise, promotional
                offers do not permanently modify Aether&apos;s standard pricing.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Aether may change pricing or plan structures prospectively. When a pricing
                change affects an existing paid subscription, we will provide notice as
                required by applicable law or the terms presented with that subscription.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">6. Third-Party Integrations and Services</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Aether may connect with or provide access to third-party platforms, websites,
                APIs, applications, payment or fundraising systems, communications services,
                mapping services, social platforms, cloud services, or other external products.
                Your use of a third-party service may also be governed by that provider&apos;s
                terms and privacy policy.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Third-party services are not controlled by Aether. We are not responsible for
                their independent acts, omissions, content, security, pricing, availability,
                policy changes, or decisions to modify or discontinue access to their services
                or APIs. Aether may modify or discontinue an integration if the third-party
                service changes, access becomes unavailable, continued operation presents a
                security or compliance concern, or maintaining the integration is no longer
                reasonably practical.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">7. Artificial Intelligence and Automated Features</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Aether may offer features, recommendations, analyses, links, or workflows that
                use artificial intelligence, automated processing, or external AI services.
                These tools are intended to assist human decision-making, not replace it.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                AI-generated or automated outputs may be incomplete, inaccurate, outdated, or
                inappropriate for a particular situation. You are responsible for reviewing
                outputs before relying on them or using them in campaign, financial, legal,
                compliance, communications, field, or other decisions. When you choose to use
                an independent external AI service, that provider&apos;s terms and privacy
                practices also apply.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">8. Acceptable Use</h2>
              <p className="mt-4 leading-8 text-slate-300">
                You may not misuse Aether or use the Services in a way that harms Aether,
                another organization, another person, or the integrity of the platform.
                Prohibited conduct includes:
              </p>
              <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-slate-300">
                <li>using the Services for unlawful activity;</li>
                <li>
                  attempting to gain unauthorized access to another account, organization,
                  system, or data;
                </li>
                <li>
                  probing, bypassing, disabling, or interfering with authentication, access
                  controls, security measures, rate limits, or technical protections;
                </li>
                <li>
                  introducing malware, malicious code, destructive content, or activity
                  intended to disrupt the Services;
                </li>
                <li>
                  using Aether to send communications in violation of applicable law or without
                  required authorization or consent;
                </li>
                <li>
                  scraping, copying, reverse engineering, or systematically extracting the
                  Services except where such restriction is prohibited by applicable law;
                </li>
                <li>
                  impersonating another person or organization or materially misrepresenting
                  your authority to act for an organization; or
                </li>
                <li>
                  using the Services in a manner that materially interferes with other users or
                  Aether&apos;s ability to operate the platform.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold">9. Campaign, Election, and Compliance Responsibilities</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Aether provides operational software. Aether is not a law firm, accounting
                firm, campaign-finance compliance firm, political committee, fundraising
                intermediary, or substitute for professional advisers.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Political campaigns and organizations are responsible for their own compliance
                with applicable election, campaign-finance, fundraising, communications,
                privacy, employment, recordkeeping, reporting, disclaimer, consent, and other
                legal requirements. The availability of a feature in Aether does not mean that
                every use of that feature is lawful in every jurisdiction or circumstance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">10. Platform Availability and Changes to the Services</h2>
              <p className="mt-4 leading-8 text-slate-300">
                We work to provide reliable Services, but Aether is not guaranteed to be
                uninterrupted, error-free, or available at all times. Maintenance, deployments,
                third-party outages, internet failures, security events, technical problems,
                and circumstances outside our reasonable control may affect availability.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Aether may add, modify, replace, suspend, or discontinue features as the
                platform evolves. We will use reasonable efforts to avoid unnecessary disruption
                and, when appropriate, provide notice of material changes that substantially
                affect paid Services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">11. Intellectual Property</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Aether Systems LLC and its licensors retain all rights in the Services,
                including Aether&apos;s software, source code, interfaces, designs, branding,
                documentation, training materials, graphics, workflows, and other platform
                materials, except for content owned by users or third parties.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Subject to these Terms and payment of applicable fees, Aether grants you a
                limited, non-exclusive, non-transferable, revocable right to access and use the
                Services for your organization&apos;s authorized operations during the
                applicable subscription or access period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">12. Feedback</h2>
              <p className="mt-4 leading-8 text-slate-300">
                If you voluntarily provide ideas, suggestions, or feedback about Aether, you
                allow us to use that feedback to improve, develop, and operate the Services
                without an obligation to compensate you. This does not give Aether ownership
                of your campaign data or confidential organization content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">13. Suspension and Termination</h2>
              <p className="mt-4 leading-8 text-slate-300">
                You may stop using Aether or cancel Services subject to the terms of your
                subscription or agreement. Aether may suspend or terminate access when
                reasonably necessary because of nonpayment, a material violation of these
                Terms, unlawful activity, a security threat, abuse of the Services, or conduct
                that creates material risk to Aether, our users, or third parties.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                When reasonably possible, we will provide notice and an opportunity to address
                a correctable issue before termination. Immediate action may be taken when
                necessary to protect security, comply with law, prevent harm, or respond to
                serious abuse.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">14. Disclaimers</h2>
              <p className="mt-4 leading-8 text-slate-300">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED
                &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; AETHER DISCLAIMS WARRANTIES
                THAT ARE NOT EXPRESSLY PROVIDED IN THESE TERMS, INCLUDING IMPLIED WARRANTIES
                OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Aether does not guarantee campaign outcomes, election results, fundraising
                results, voter or supporter responses, regulatory compliance, the accuracy of
                third-party data, or the availability or performance of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">15. Limitation of Liability</h2>
              <p className="mt-4 leading-8 text-slate-300">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AETHER SYSTEMS LLC AND ITS MEMBERS,
                MANAGERS, EMPLOYEES, CONTRACTORS, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR
                LOST PROFITS, LOST REVENUE, LOST OPPORTUNITIES, LOSS OF GOODWILL, OR LOSS OR
                CORRUPTION OF DATA, ARISING OUT OF OR RELATED TO THE SERVICES.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AETHER&apos;S TOTAL AGGREGATE LIABILITY
                ARISING OUT OF OR RELATING TO THE SERVICES OR THESE TERMS WILL NOT EXCEED THE
                AMOUNT PAID TO AETHER BY THE APPLICABLE ORGANIZATION FOR THE SERVICES DURING
                THE TWELVE MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
                Nothing in these Terms excludes or limits liability that cannot lawfully be
                excluded or limited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">16. Indemnification</h2>
              <p className="mt-4 leading-8 text-slate-300">
                To the extent permitted by law, you agree to defend, indemnify, and hold
                harmless Aether Systems LLC and its members, managers, employees, contractors,
                and agents from third-party claims, damages, liabilities, losses, and reasonable
                costs arising from your organization&apos;s unlawful use of the Services,
                violation of these Terms, infringement of another party&apos;s rights, or data
                or content that your organization provides to Aether without sufficient rights
                or authorization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">17. Governing Law and Disputes</h2>
              <p className="mt-4 leading-8 text-slate-300">
                These Terms are governed by the laws of the state in which Aether Systems LLC
                is organized, without regard to conflict-of-law principles, except where
                applicable law requires otherwise. Before filing a formal legal action, you
                and Aether agree to make a good-faith effort to resolve the dispute by
                contacting the other party and describing the issue and requested resolution.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                Any venue, jurisdiction, arbitration, jury-waiver, or other formal dispute
                procedure contained in a separate written agreement between Aether and your
                organization will control to the extent it conflicts with this section.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">18. Changes to These Terms</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Aether may update these Terms as the Services evolve, our business practices
                change, or legal requirements develop. We will update the &quot;Last
                updated&quot; date when changes are made. When appropriate, material changes
                may also be communicated through the Services or other reasonable means.
                Continued use of the Services after updated Terms become effective constitutes
                acceptance of the updated Terms to the extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">19. General Terms</h2>
              <p className="mt-4 leading-8 text-slate-300">
                If a provision of these Terms is found unenforceable, the remaining provisions
                will remain in effect to the extent permitted by law. Aether&apos;s failure to
                enforce a provision is not a waiver of its right to do so later. You may not
                assign your rights or obligations under these Terms without Aether&apos;s
                consent, except as permitted by applicable law. Aether may assign these Terms
                in connection with a merger, acquisition, reorganization, financing, or sale
                of all or substantially all relevant business assets.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold">20. Questions</h2>
              <p className="mt-4 leading-8 text-slate-300">
                If you have questions about these Terms, your subscription, account access, or
                the Services, please contact Team Aether.
              </p>
            </section>
          </div>

          <div className="mt-12 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-6">
            <p className="leading-7 text-slate-300">
              <strong className="text-white">The basic deal:</strong> Aether provides the
              operating system. Your organization owns its data, controls its campaign, and
              remains responsible for the decisions it makes.
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href="/public-team-aether#contact-team-aether"
              className="rounded-xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-500"
            >
              Contact Team Aether
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
