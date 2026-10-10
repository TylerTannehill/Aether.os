"use client";

import { useMemo, useState } from "react";

export default function BusinessFAQPage() {
  const [query, setQuery] = useState("");
  const faqItems = [
    { question: "What is Aether Business?", answer: [
      "Aether Business is a modular operating system designed to bring the essential functions of an organization into one coordinated environment.",
      "Rather than requiring businesses to adopt a fixed collection of tools, Aether allows organizations to configure their operating environment around the departments and capabilities they actually need.",
      "From small businesses managing a handful of operational functions to enterprise organizations coordinating multiple departments, Aether provides a unified foundation for visibility, organization, and execution."
    ] },
    { question: "Is Aether Business suitable for small businesses?", answer: [
      "Yes. Aether Business is designed with a plug-and-play approach that allows smaller organizations to start with the operational modules most relevant to their business.",
      "A company may begin with CRM and Inventory, for example, without needing to adopt Marketing, Dispatch, or Finance at the same time.",
      "This modular structure helps businesses avoid unnecessary complexity while maintaining the flexibility to expand their operating environment as their needs evolve."
    ] },
    { question: "Can I add or remove modules as my business changes?", answer: [
      "Yes. Aether Business is designed around a flexible, modular subscription model.",
      "Organizations can expand their configuration by adding departments as their operations grow, or simplify their configuration by removing modules they no longer require.",
      "The goal is to provide an operating system that can scale both upward and downward without forcing businesses into a permanently fixed software configuration."
    ] },
    { question: "How does Aether Business support enterprise organizations?", answer: [
      "Enterprise operations rarely exist within a single department. Customer relationships, marketing activity, financial oversight, inventory management, and operational coordination all influence one another.",
      "Aether Business is designed to provide a common operational foundation across these functions, allowing organizations to maintain departmental specialization while improving visibility and coordination across the broader business.",
      "Rather than treating each department as an isolated software environment, Aether approaches the organization as an interconnected operating system.",
      "This creates a framework capable of supporting complex organizational structures without losing sight of the individual teams responsible for execution."
    ] },
    { question: "What makes Aether Business different from traditional business software?", answer: [
      "Traditional business software often requires organizations to assemble multiple independent platforms to manage different aspects of their operations.",
      "Aether Business takes a different approach.",
      "Its modular architecture allows organizations to choose the capabilities they need while maintaining a shared operational environment.",
      "The objective is not simply to place multiple tools behind one login. It is to connect organizational visibility, departmental workflows, and operational interpretation so businesses can understand what is happening and coordinate what needs to happen next."
    ] }
  ];
  const abeItems = [
    { question: "What is A.B.E.?", answer: [
      "A.B.E. stands for Aether Brain Engine.",
      "A.B.E. is the operational intelligence layer built into Aether Business. It interprets information from an organization's active departments to identify operational conditions, emerging pressures, and areas that may require attention.",
      "Rather than simply presenting data through charts and dashboards, A.B.E. helps organizations understand what their operational information means and where attention may be needed.",
      "Its purpose is straightforward: turn everyday business activity into greater operational clarity."
    ] },
    { question: "Does A.B.E. use artificial intelligence?", answer: [
      "No. A.B.E. does not rely on generative artificial intelligence or large language models.",
      "Instead, A.B.E. uses a deterministic interpretation engine that evaluates real operational data against defined business rules and conditions.",
      "This approach keeps A.B.E.'s observations grounded in recorded business activity rather than AI-generated assumptions.",
      "A.B.E. is designed to provide consistent, explainable operational interpretation without requiring a generative AI service."
    ] },
    { question: "What does A.B.E. monitor?", answer: [
      "A.B.E. examines operational information from the departments enabled within an organization's Aether Business environment.",
      "Depending on the organization's configuration, these may include CRM, Marketing, Inventory, Dispatch, and Finance. A.B.E. can also summarize organization-wide Projects & Tasks activity, which is included with Aether Business.",
      "A.B.E. is designed to identify conditions such as changing activity levels, outstanding work, operational bottlenecks, inventory concerns, and other department-specific signals supported by the available records.",
      "Department-specific visibility depends on provisioned modules and available operational records. Projects & Tasks provides an additional standard, organization-wide work signal."
    ] },
    { question: "How is A.B.E. different from a traditional dashboard?", answer: [
      "A traditional dashboard tells you what happened. A.B.E. helps explain what deserves attention.",
      "Dashboards organize information into charts, totals, and performance indicators. A.B.E. evaluates operational conditions behind those figures to highlight patterns, pressure points, and potential areas of concern.",
      "For example, an Inventory dashboard may show available stock levels. A.B.E. can interpret inventory records against defined operational conditions to highlight stock-related concerns that warrant review.",
      "A.B.E. complements departmental dashboards rather than replacing them."
    ] },
    { question: "Does A.B.E. make decisions or perform work automatically?", answer: [
      "No. A.B.E. is designed to interpret operational conditions and communicate its findings, not independently make business decisions or execute departmental work.",
      "Employees and administrators remain responsible for evaluating priorities, making decisions, and completing operational tasks.",
      "A.B.E.'s role is to improve awareness so people can act with better information."
    ] },
    { question: "How does A.B.E. work with Focus Mode?", answer: [
      "A.B.E. and Focus Mode serve complementary purposes within Aether Business.",
      "A.B.E. interprets operational information and highlights conditions that may need attention. Focus Mode provides a structured environment for employees to work through departmental responsibilities.",
      "Both systems operate from the same underlying organizational records, allowing operational interpretation and execution workflows to remain aligned.",
      "A.B.E. does not need to read or control the Focus Mode interface to understand operational activity."
    ] },
    { question: "Does A.B.E. become more useful as my business grows?", answer: [
      "A.B.E. is designed to scale alongside an organization's operational environment.",
      "A smaller business using only a few modules can receive interpretations based on those departments. As additional modules are enabled and more operational information becomes available, A.B.E. has a broader view of the organization's activity.",
      "For larger organizations, this provides a foundation for understanding operational conditions across multiple departments without requiring each team to operate in complete isolation.",
      "The underlying principle remains the same regardless of organizational size: interpret the information available, identify meaningful conditions, and help people understand what needs attention."
    ] }
  ];
  const overviewItems = [
    { question: "What is the Business Overview?", answer: [
      "The Business Overview, also known as the Business Hub, is Aether Business's central operational awareness environment.",
      "It brings together departmental analytics, operational trends, and A.B.E.'s business interpretation into a single view.",
      "Rather than requiring leadership to visit each department individually to understand the state of the organization, the Business Hub provides a consolidated starting point for evaluating activity and identifying areas that may require attention."
    ] },
    { question: "What information does the Business Overview display?", answer: [
      "The Business Overview contains three primary information areas: the A.B.E. Business Snapshot, Business Trends, and Operational Analytics.",
      "A.B.E. provides a written interpretation of current operational conditions. Business Trends visualizes department-specific activity over time. Operational Analytics presents key metrics from the organization's enabled departments.",
      "Together, these components provide both a numerical and contextual view of business operations."
    ] },
    { question: "Does the Overview change based on my organization's modules?", answer: [
      "Yes. The Business Overview adapts to the operational modules provisioned for the organization.",
      "Businesses using only a few departments see analytics and trends associated with those departments. Organizations with additional modules receive a broader view of operational activity.",
      "A.B.E. also uses the organization's enabled modules to determine which departmental information it can interpret.",
      "This allows the Overview to scale alongside the business without presenting unrelated departmental information."
    ] },
    { question: "What are Business Trends?", answer: [
      "Business Trends are department-specific charts that visualize operational metrics over time.",
      "Users can switch between enabled departments to examine different aspects of business activity.",
      "CRM: interactions and follow-ups. Marketing: impressions and engagements. Inventory: available inventory and items needing reorder. Dispatch: completed and active jobs. Finance: net cash movement and outstanding obligations.",
      "These charts help organizations examine operational movement rather than relying exclusively on current totals."
    ] },
    { question: "What is Operational Analytics?", answer: [
      "Operational Analytics provides a concise numerical summary of activity across the organization's enabled departments.",
      "Each department is represented by a card containing two primary operational indicators.",
      "These metrics allow users to quickly compare the current state of different business functions without navigating away from the Overview.",
      "For deeper analysis or direct work, users can continue into the relevant departmental environment."
    ] },
    { question: "How does A.B.E. work within the Business Overview?", answer: [
      "The A.B.E. Business Snapshot interprets recorded operational information from the organization's enabled departments.",
      "It examines conditions such as CRM follow-up activity, marketing performance and content status, inventory replenishment needs, dispatch workload, outstanding financial obligations, and overall Projects & Tasks activity.",
      "A.B.E. also incorporates information associated with departmental Focus workflows, helping connect broader business metrics with work awaiting attention.",
      "Its observations are generated through defined rules applied to operational records, not through generative artificial intelligence."
    ] },
    { question: "Can I manage tasks directly from the Business Overview?", answer: [
      "The Business Overview is primarily designed for observation, interpretation, and operational awareness.",
      "Its charts and analytics help users understand organizational conditions, while departmental pages and Focus Mode provide the environments for managing and completing work.",
      "This separation helps keep executive visibility distinct from day-to-day execution without disconnecting the information supporting both."
    ] },
    { question: "What happens if my business doesn't have enough data to display trends?", answer: [
      "Aether Business does not manufacture historical activity to populate its charts.",
      "When a department has no recorded trend data, its chart displays an appropriate empty state.",
      "Inventory and Dispatch also support historical snapshots, allowing their trend visualizations to develop as additional snapshots become available.",
      "A.B.E. similarly distinguishes between recorded activity and situations where the available information is insufficient to establish an operational pattern."
    ] }
  ];
  const focusItems = [
    { question: "What is Focus Mode?", answer: [
      "Focus Mode is Aether Business's departmental execution environment.",
      "While the Business Overview helps organizations understand what is happening, Focus Mode helps employees act on work that needs to be completed.",
      "Each department has a dedicated Focus environment that organizes relevant responsibilities into clear workflows, helping teams move from operational awareness to meaningful action."
    ] },
    { question: "How does Focus Mode work?", answer: [
      "Focus Mode organizes operational work into specialized execution lanes based on the department and the type of activity involved.",
      "These lanes surface relevant records, outstanding responsibilities, and actionable items so employees can identify what needs attention and move work forward.",
      "Rather than presenting an unstructured collection of information, Focus Mode gives departmental activity a practical execution framework."
    ] },
    { question: "What departments have Focus Mode?", answer: [
      "Focus Mode is available across Aether Business's five operational departments.",
      "CRM: customer lists, follow-ups, and relationship work. Marketing: content production, spending, and audience response. Inventory: reordering, purchasing, and deliveries. Dispatch: job assignment, routing, and execution. Finance: incoming payments, outgoing obligations, and transaction reviews.",
      "Each environment is designed around the actual responsibilities of its department rather than forcing every team into the same workflow."
    ] },
    { question: "Where does Focus Mode get its work?", answer: [
      "Focus Mode draws from operational records maintained within Aether Business.",
      "Depending on the department, these records may include customer follow-ups, work lists, marketing content, inventory levels, purchase orders, dispatch jobs, or financial obligations.",
      "Focus Mode uses those records to organize existing work and identify conditions that require attention.",
      "The work comes from the business's actual operations, not artificially generated tasks."
    ] },
    { question: "Can employees complete work directly in Focus Mode?", answer: [
      "Yes. Focus Mode supports direct execution of departmental responsibilities where the relevant actions are available.",
      "Employees can perform activities such as assigning dispatch jobs, progressing purchasing work, recording financial obligations as resolved, and reviewing marketing workflows.",
      "Some activities also connect employees to dedicated records or workspaces, such as customer lists and contact information.",
      "This allows Focus Mode to serve as an execution environment rather than simply another reporting screen."
    ] },
    { question: "How does Focus Mode help teams prioritize work?", answer: [
      "Focus Mode separates different types of responsibilities into clearly defined lanes, allowing employees to concentrate on the work relevant to their department.",
      "Some environments also display priority indicators, due dates, or operational conditions that help distinguish immediate needs from other responsibilities.",
      "By organizing work according to its purpose and current state, Focus Mode helps teams maintain direction without losing visibility into their broader workload."
    ] },
    { question: "What happens when there is no work requiring attention?", answer: [
      "Focus Mode displays an appropriate empty state when its execution lanes have no qualifying work.",
      "An empty lane can indicate that a particular responsibility has been addressed or that no relevant operational records currently require action.",
      "Focus Mode does not manufacture tasks simply to keep employees busy.",
      "Its purpose is to organize meaningful work when that work exists."
    ] },
    { question: "How does Focus Mode connect with A.B.E. and the Business Overview?", answer: [
      "The Business Overview, A.B.E., and Focus Mode serve different but complementary roles.",
      "The Overview provides organizational visibility. A.B.E. interprets operational conditions. Focus Mode organizes the responsibilities and actions associated with departmental execution.",
      "Because these systems work from the organization's underlying operational records, they provide different perspectives on the same business activity.",
      "Together, they connect awareness, interpretation, and execution within a coordinated operating environment."
    ] },
    { question: "Does Focus Mode replace the regular department pages?", answer: [
      "No. Focus Mode complements the regular departmental environments.",
      "Department pages provide broader access to records, information, management functions, and departmental analytics.",
      "Focus Mode concentrates on the responsibilities and workflows that move work toward completion.",
      "Both are essential parts of Aether Business: one provides the broader operational workspace, while the other emphasizes execution."
    ] }
  ];
  const crmItems = [
    { question: "What is Business CRM?", answer: [
      "Business CRM is Aether Business's customer relationship management environment.",
      "It brings customer records, communication activity, follow-up responsibilities, and relationship visibility into one coordinated workspace.",
      "Rather than treating customer information as an isolated directory, Business CRM helps organizations understand who they are working with, what interactions have occurred, and which relationships require continued attention.",
    ] },
    { question: "What information does the CRM dashboard display?", answer: [
      "The CRM dashboard provides an overview of customer relationship activity through a Contact Activity chart, operational metrics, quick-access tools, and the Relationship Pipeline.",
      "Its primary metrics include Total Contacts, CRM Lists, Contacted, and Requires Follow-Up.",
      "Together, these indicators help teams understand the size of their customer base, how much relationship activity has been recorded, and where additional outreach may be needed.",
    ] },
    { question: "What is the Relationship Pipeline?", answer: [
      "The Relationship Pipeline is a consolidated view of customer records and their associated activity.",
      "It allows teams to review contacts alongside their latest recorded activity, assigned ownership status, and upcoming follow-up actions.",
      "The pipeline helps employees identify relationships that may require attention without having to open every individual contact record.",
    ] },
    { question: "How does Aether track customer interactions?", answer: [
      "Business CRM uses recorded interactions to maintain visibility into customer communication.",
      "Supported interaction types include phone conversations, unanswered calls, emails, email responses, text messages, and text responses.",
      "These records help employees understand the history of contact with a customer and provide context for future relationship work.",
    ] },
    { question: "How do CRM follow-ups work?", answer: [
      "CRM follow-ups identify customer relationships with scheduled next actions.",
      "Follow-up records connect a contact to an intended communication action and a follow-up date.",
      "The CRM dashboard uses these records to show which contacts require follow-up, while the Relationship Pipeline displays the next scheduled action associated with each contact.",
      "This helps teams maintain continuity in customer communication.",
    ] },
    { question: "Can I search for customers directly from CRM?", answer: [
      "Yes. Business CRM includes a Find Contact tool that searches existing customer records.",
      "Employees can search using information such as a customer's name, email address, phone number, or company.",
      "Matching results provide direct access to the customer's individual profile, allowing employees to move quickly from finding a contact to reviewing their information.",
    ] },
    { question: "What are CRM Lists?", answer: [
      "CRM Lists provide a way to organize groups of customer records for relationship work.",
      "The CRM dashboard displays the number of lists associated with the CRM department and provides a quick-access selector for opening an existing CRM list.",
      "Lists help employees move from broad customer visibility into a more focused collection of records and related work.",
    ] },
    { question: "Can I filter the Relationship Pipeline?", answer: [
      "Yes. The Relationship Pipeline includes a search tool and filters that help employees narrow their view of customer activity.",
      "Employees can display all contacts, focus on contacts with scheduled follow-ups, or review contacts awaiting a response.",
      "The Awaiting Response filter identifies contacts whose latest recorded interaction was an outgoing email or text message, helping employees distinguish pending communication from other relationship activity.",
    ] },
    { question: "How does CRM connect with Focus Mode?", answer: [
      "The CRM dashboard and CRM Focus Mode serve complementary purposes.",
      "The dashboard provides broader visibility into customer relationships, recorded activity, and upcoming actions.",
      "CRM Focus Mode concentrates on executing customer-related responsibilities, including work organized through customer lists and follow-up workflows.",
      "Together, they help employees move from understanding relationship activity to completing the work associated with it.",
    ] },
    { question: "How does CRM support coordination across the business?", answer: [
      "Business CRM provides a shared foundation for customer information and relationship activity.",
      "Customer records can support the broader organization by keeping communication history, contact details, and follow-up responsibilities organized in a consistent environment.",
      "As part of Aether Business, CRM contributes to the organization's operational visibility while maintaining a dedicated workspace for customer relationship management.",
    ] },
  ];

  const dispatchItems = [
    { question: "What is Business Dispatch?", answer: ["Business Dispatch is Aether Business's operational coordination environment for managing jobs, service locations, schedules, and work assignments.", "It gives organizations a centralized workspace for understanding what work exists, where that work needs to happen, who is responsible, and how jobs are progressing."] },
    { question: "What information does the Dispatch dashboard display?", answer: ["The Dispatch Command Center provides a consolidated view of operational activity through five primary indicators: Active Jobs, Unassigned, In Progress, Route Ready, and Completed.", "Additional indicators summarize scheduled jobs, recorded assignments, and service locations. Together, these provide visibility into workload, ownership, and operational progress."] },
    { question: "How do I create a new Dispatch job?", answer: ["Select New Job from the Dispatch Command Center, enter a job name, and choose the customer or service location associated with the work.", "You can create a job for an existing customer, select multiple customers, use a Dispatch list, or enter a service address manually for a one-time job.", "New jobs enter the Dispatch workflow as unassigned work, ready for further coordination."] },
    { question: "Can I create jobs for multiple customers at once?", answer: ["Yes. Business Dispatch supports creating jobs for multiple customers through individual customer selection or an existing Dispatch list.", "Each selected customer receives a separate Dispatch job using that customer's saved service address.", "This helps teams prepare larger batches of customer-related work without creating each job individually."] },
    { question: "How do Dispatch jobs connect to customer records?", answer: ["Dispatch can associate jobs with existing customer records maintained within Aether Business.", "When a customer is selected, their saved service address can be used to establish the job location.", "This helps keep operational work connected to the customer it serves while reducing repeated entry of customer information."] },
    { question: "Can I edit jobs after creating them?", answer: ["Yes. Employees can open an existing job from the Jobs & Work Orders section to update its information.", "Available changes include the job name, associated customer, service address, scheduled start, and scheduled end.", "This allows teams to keep job details current as operational requirements change."] },
    { question: "How does Dispatch track job progress?", answer: ["Business Dispatch organizes work using five job statuses: Unassigned, Assigned, Scheduled, In Progress, and Completed.", "These statuses help employees understand which jobs still need ownership, which have been prepared for execution, which are underway, and which have been finished.", "The dashboard uses these records to maintain an up-to-date picture of operational activity."] },
    { question: "How are employees assigned to Dispatch jobs?", answer: ["Dispatch tracks job ownership by associating work with assigned team members.", "The dashboard displays the responsible employee when an assignment exists and identifies unassigned jobs requiring attention.", "Dispatch Focus Mode provides a dedicated assignment workflow for coordinating work ownership and moving jobs toward execution."] },
    { question: "How does Dispatch handle scheduling and service locations?", answer: ["Dispatch records scheduled start and end times alongside each job’s service address.", "The Jobs & Work Orders view makes this information visible with the job’s assignment and current status.", "These details help teams coordinate when work should occur and where employees need to perform it."] },
    { question: "What does Route Ready mean?", answer: ["Route Ready identifies active Dispatch jobs that have a recorded service address.", "It helps teams understand how much outstanding work has the location information needed for routing preparation.", "Route Ready does not mean a route has already been generated or optimized."] },
    { question: "How does Dispatch connect with Focus Mode?", answer: ["The Dispatch dashboard provides broader visibility into jobs, assignments, schedules, locations, and operational status.", "Dispatch Focus Mode concentrates on three execution areas: Assignment, Routing, and Execution.", "Together, these environments help employees move from reviewing the workload to coordinating responsibility, preparing routes, and progressing operational work."] },
  ];

  const financeItems = [
    { question: "What is Business Finance?", answer: ["Business Finance is Aether Business's financial operations environment. It provides a centralized view of money coming into and going out of an organization, alongside expected payments and outstanding financial responsibilities.", "Its purpose is to help businesses understand their financial activity and identify work that requires attention."] },
    { question: "What information does the Finance dashboard display?", answer: ["The Finance Command Center presents four primary metrics: Money In, Money Out, Net, and Outstanding.", "These indicators distinguish recorded financial transactions from expected incoming and outgoing payments, giving businesses a clearer picture of actual activity and unresolved financial obligations."] },
    { question: "What is the Financial Flow chart?", answer: ["The Financial Flow chart visualizes recorded money coming in, money going out, and net financial movement over time.", "Employees can examine activity using Today, Week, Month, Quarter, and All Time views.", "The chart uses recorded transactions rather than estimated or manufactured financial activity."] },
    { question: "What is the difference between a transaction and an obligation?", answer: ["A transaction represents financial activity that has already occurred, such as money received or money paid.", "An obligation represents money the business expects to receive or needs to pay, associated with a due date and a current status.", "Keeping these records separate helps businesses distinguish actual cash movement from outstanding financial responsibilities."] },
    { question: "How do I record an expected payment?", answer: ["Select Manual Entry from the Finance dashboard to create a financial obligation.", "Choose Money In or Money Out, enter the amount, due date, and description, and optionally identify the customer, vendor, contractor, or other counterparty.", "The obligation becomes part of the organization's outstanding financial work. Creating an obligation does not record a completed transaction."] },
    { question: "How does Finance identify overdue payments?", answer: ["Business Finance evaluates open financial obligations against their recorded due dates.", "The Financial Attention panel identifies overdue obligations and summarizes expected incoming and outgoing payments. It can also indicate when obligations are due today.", "This helps employees recognize financial responsibilities that may require timely action."] },
    { question: "Can I import financial information into Aether?", answer: ["Yes. Business Finance provides a CSV Import option for bringing historical or external financial records into the system.", "The Finance dashboard also includes a Recent Transactions area that displays recorded financial activity from supported sources.", "Imported information contributes to financial visibility as transactions are successfully recorded."] },
    { question: "What does the Recent Transactions section show?", answer: ["Recent Transactions displays recorded financial activity, including transaction descriptions, dates, counterparties or sources, and amounts.", "Incoming and outgoing transactions are distinguished visually, helping employees review recent money movement without leaving the Finance dashboard."] },
    { question: "How does Business Finance connect with Focus Mode?", answer: ["The Finance dashboard provides financial visibility, while Finance Focus Mode concentrates on responsibilities requiring action.", "Finance Focus Mode organizes work into three areas: Receive, Pay, and Review.", "Outstanding obligations help drive incoming and outgoing payment workflows, while transaction records requiring review support the financial review process."] },
    { question: "Does Business Finance replace my accounting software?", answer: ["No. Business Finance is designed for operational financial visibility rather than replacing an organization's accounting system.", "It helps businesses understand recorded money movement, expected payments, outstanding obligations, and related operational responsibilities.", "Accounting and payment platforms remain the systems of record for their respective functions."] },
    { question: "Can Business Finance work with connected financial systems?", answer: ["Business Finance is structured to bring information from manual entry, CSV imports, and supported connected systems into a coordinated financial view.", "The dashboard provides access to Aether's Tools environment for integrations.", "Availability of specific financial connections depends on which integrations are supported and configured for the organization."] },
  ];

  const inventoryItems = [
    { question: "What is Business Inventory?", answer: ["Business Inventory is Aether Business's inventory and purchasing management environment. It brings stock records, reserved quantities, reorder thresholds, purchase orders, and incoming deliveries into one operational workspace, helping teams understand both current availability and upcoming replenishment."] },
    { question: "What does the Inventory Command Center display?", answer: ["The Command Center displays five primary indicators: Items, On Hand, Reserved, Available, and Active Orders. It also provides access to the inventory table, Reorder Watch, purchase orders, deliveries, and Inventory Focus Mode."] },
    { question: "How do I add and manage inventory items?", answer: ["Employees can create inventory records with an item name, quantity on hand, reserved quantity, and optional reorder point. Existing records can be edited as inventory details change, and the inventory table includes a search function for locating items."] },
    { question: "Can I customize the information tracked for inventory?", answer: ["Yes. Define Column allows an organization to create custom inventory fields using text, number, date, or Yes/No values. These fields become part of the inventory entry and editing experience, allowing different businesses to describe their stock using terminology relevant to their operations."] },
    { question: "What is the difference between On Hand, Reserved, and Available?", answer: ["On Hand represents the physical stock recorded for an item. Reserved represents stock already committed to a purpose. Available reflects the unreserved portion of stock. At the item level, available quantity is calculated by subtracting Reserved from On Hand, with negative availability displayed as zero in the summary."] },
    { question: "How does Reorder Watch work?", answer: ["Reorder Watch identifies items whose available stock has reached or fallen below their configured reorder point. This helps teams recognize replenishment needs using recorded inventory quantities and thresholds rather than manually inspecting every item."] },
    { question: "How do purchase orders work?", answer: ["Employees can create purchase orders containing one or more inventory items and their requested quantities. Orders may also include an expected date and notes. New orders begin as drafts, allowing teams to review and edit their details before marking them as Ordered."] },
    { question: "What purchase order statuses are supported?", answer: ["Business Inventory supports Draft, Ordered, Partially Received, Received, and Cancelled purchase order statuses. These states distinguish purchasing work that is still being prepared, orders awaiting inventory, and orders for which stock has been partially or fully recorded as received."] },
    { question: "How do incoming deliveries connect to purchase orders?", answer: ["Incoming deliveries are associated with purchase orders that have been marked Ordered or Partially Received. A delivery can include an expected arrival date, tracking number, and delivery instructions. This gives employees a place to coordinate shipment information alongside the purchasing records it supports."] },
    { question: "Can I record partial deliveries?", answer: ["Yes. Employees can record received quantities for individual items on an incoming delivery. Recording a receipt adds those quantities to inventory On Hand and updates the associated purchase order's received quantities. A delivery can remain open for additional receipts until an employee explicitly finishes it."] },
    { question: "What happens when I finish a delivery?", answer: ["Finishing a delivery records its completion and closes that shipment against further receipt edits. Recording received inventory and finishing the delivery are separate actions, giving teams control over whether additional stock is still expected on that particular shipment."] },
    { question: "How does Inventory connect with Focus Mode?", answer: ["The Inventory Command Center provides the broader view of stock, purchasing, and delivery records. Inventory Focus Mode organizes operational work into three execution areas: Reorder, Purchasing, and Delivery. Together, they help employees move from recognizing inventory needs to managing the work required to address them."] },
  ];

  const marketingItems = [
    { question: "What is Business Marketing?", answer: ["Business Marketing is Aether Business's workspace for understanding marketing performance and coordinating content operations. It brings platform analytics, audience engagement, advertising spend, content activity, and performance history into one environment."] },
    { question: "What does the Marketing Command Center display?", answer: ["The Command Center presents four primary indicators: Impressions, Engagement, Spend, and Sentiment. It also includes performance trends, platform-level metrics, content pipeline activity, and a summary of the marketing records available to the organization."] },
    { question: "Which marketing platforms can Aether recognize?", answer: ["The dashboard recognizes Meta/Facebook, Instagram, X, TikTok, YouTube, and website analytics, along with other labeled data sources. Metrics appear when corresponding records are available. Recognition of a platform does not mean its integration is automatically connected."] },
    { question: "What do Impressions, Engagement, Spend, and Sentiment mean?", answer: ["Impressions measure recorded content visibility. Engagement represents recorded audience interactions. Spend reflects recorded paid-media expenditures. Sentiment summarizes positive and negative audience-response metrics where that information is available. These values come from the organization's marketing records rather than estimated activity."] },
    { question: "How does the Performance Trend chart work?", answer: ["The Performance Trend chart visualizes recorded marketing activity over time. Employees can switch between Impressions, Engagement, Spend, and Sentiment to examine different measures of performance. The chart displays up to 12 dated points based on available analytics records."] },
    { question: "Can I compare performance across marketing platforms?", answer: ["Yes. The Platform Performance section provides individual platform summaries showing impressions, engagement, spend, click-through rate (CTR), and sentiment where recorded. This allows employees to compare available marketing metrics across channels."] },
    { question: "How do I import marketing analytics?", answer: ["Select Import Analytics from the Marketing Command Center to open the analytics import workflow. Once supported records have been successfully imported and are available to the organization, they can contribute to the dashboard's performance indicators and charts."] },
    { question: "What is the Content Pipeline?", answer: ["The Content Pipeline provides a view of operational marketing work. It connects employees to four areas of Marketing Focus Mode: Content, Spend, Audience Response, and History. The dashboard also summarizes active content items, open engagement activity, and completed posts."] },
    { question: "How are active and completed content items counted?", answer: ["Active Content counts non-archived content records that are not marked Published. Completed Posts counts non-archived records marked Published. These indicators reflect saved content workflow records, not automatically detected posts across every social platform."] },
    { question: "What does Open Engagements mean?", answer: ["Open Engagements is an operational indicator derived from recorded platform engagement and the latest saved response-review baseline for each platform. It helps identify engagement activity that has accumulated since the previous review. It does not automatically represent a count of individual unread messages or comments."] },
    { question: "How does Marketing connect with Focus Mode?", answer: ["The Command Center provides visibility into marketing performance, while Marketing Focus Mode organizes execution into Content, Spend, Audience Response, and History. Teams can use these areas to coordinate content preparation, review spending, assess audience response, and access completed marketing work."] },
    { question: "Can I export Marketing data?", answer: ["Yes. Export Analytics CSV downloads the analytics records available to the dashboard. Export Content History CSV downloads published and archived content records from the organization's marketing workflow. The export options are available when qualifying records exist."] },
    { question: "Does Aether automatically publish content or manage advertising campaigns?", answer: ["The Marketing Command Center tracks recorded performance and connects employees to operational workflows. The dashboard itself does not establish automatic social publishing, advertising purchases, or autonomous campaign management. Any connected-platform capabilities depend on the integrations and workflows actually configured."] },
  ];
  const toolsItems = [
    { question: "What is the Business Tools Workspace?", answer: ["Business Tools is the organization's shared workspace for internal coordination and everyday utilities. It brings Business Coordination, Team Status, Google email, calendar, and file access together, with a direct link to the Integrations Hub."] },
    { question: "What is Business Coordination?", answer: ["Business Coordination is an organization-wide messaging area where employees can exchange operational updates. Messages are stored against the active organization and new messages can appear in real time. It is designed for lightweight internal communication rather than replacing a full project-management system."] },
    { question: "How does Team Status work?", answer: ["Team Status opens a view of organization members and their recorded roles, departments, titles, and profile statuses. It helps employees understand who belongs to the team and how people are represented within the organization."] },
    { question: "What Google utilities are available in Business Tools?", answer: ["Business Tools includes Gmail, Google Calendar, and Google Drive. When the organization has an active Google connection, the workspace can retrieve email messages, calendar information, and Drive files through the corresponding integration endpoints."] },
    { question: "Can I read and send Gmail messages inside Aether?", answer: ["Yes, when the Google integration is connected and the corresponding services are available. The Tools Workspace supports viewing messages, searching Gmail, opening individual emails, composing and sending messages, and performing supported message actions such as archiving or moving an email to trash."] },
    { question: "What can I do with Google Calendar?", answer: ["The Calendar utility retrieves the connected organization's calendars and events for viewing within Business Tools. It provides visibility into recorded meetings, appointments, and schedules. The supplied page does not establish an event-creation or editing workflow."] },
    { question: "How does Google Drive work inside Aether?", answer: ["The Drive utility displays files and folders returned by the connected Google account. Employees can navigate folders and return through the folder hierarchy. The supplied Tools page does not establish in-app document editing or file uploading."] },
    { question: "What is the Integrations Hub?", answer: ["The Integrations Hub is the organization's connection-management environment. It groups supported integrations by Marketing, Dispatch, and Business Operations, shows connection status, and provides connection or management workflows for individual services."] },
    { question: "Which integrations are listed in the Hub?", answer: ["The Hub lists Meta, Instagram, X, TikTok, YouTube, Business Website, Google Routes, Gmail, Google Calendar, and Google Drive. Some services share a connection: Instagram uses the Meta connection, while Gmail, Calendar, and Drive use a common Google connection."] },
    { question: "How do I connect an external service?", answer: ["Open the Integrations Hub, select the service, and choose Connect. Depending on the provider, Aether may redirect you to an authorization flow or present a configuration process. A successful connection is reflected in the organization's connection status. Available functionality depends on the provider and its configured integration."] },
    { question: "What do the integration statuses mean?", answer: ["Connected indicates that Aether has a saved connection for the organization. Needs Login identifies a service that requires account authorization. Ready indicates that a configuration pathway is available, while Not Connected indicates that no active connection is recorded. A Connected label does not by itself guarantee that every downstream feature is operational or syncing."] },
    { question: "How does the Business Website integration work?", answer: ["The Business Website integration provides a website-tracking setup. After creating a connection, the Hub can display an installation snippet containing the organization's public tracker identifier. The intended tracking covers page views, clicks, and form submissions. Advanced server-side access uses a separate private API key, which should not be exposed in website browser code."] },
    { question: "What does the Google Routes integration provide?", answer: ["Google Routes has a connection-verification workflow managed through Aether. Its purpose is to support routing for business service locations. However, connecting Google Routes does not establish that optimized routes are already being generated from Dispatch jobs; the actual Dispatch adapter must support that workflow."] },
    { question: "Can I disconnect an integration?", answer: ["Yes. The Integrations Hub includes a Disconnect action for supported connected providers, including Google, Meta, X, TikTok, YouTube, Business Website, and Google Routes. Disconnecting changes the organization's connection state and may make dependent features unavailable until reconnected."] },
    { question: "Does connecting a service automatically import all its data?", answer: ["No. A connection establishes or records access to a service, but data availability also depends on the provider's permissions, integration endpoints, synchronization behavior, and the features implemented in Aether. The organization should verify that expected information appears in the relevant workspace."] },
  ];
  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? faqItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : faqItems;
  }, [query]);
  const filteredAbeItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? abeItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : abeItems;
  }, [query]);
  const filteredOverviewItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? overviewItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : overviewItems;
  }, [query]);
  const filteredFocusItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? focusItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : focusItems;
  }, [query]);
  const filteredCrmItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? crmItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : crmItems;
  }, [query]);
  const filteredDispatchItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? dispatchItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : dispatchItems;
  }, [query]);
  const filteredFinanceItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? financeItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : financeItems;
  }, [query]);
  const filteredInventoryItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? inventoryItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : inventoryItems;
  }, [query]);
  const filteredMarketingItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? marketingItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : marketingItems;
  }, [query]);
  const contactsItems = [
    { question: "What is Business Contact Management?", answer: ["Contact Management is Aether Business's shared customer-record environment. It maintains contact identity and professional information while connecting each contact to notes, interactions, follow-ups, and operational lists."] },
    { question: "What information can I store for a contact?", answer: ["A contact can include first and last name, email address, phone number, company, job title, street address, city, state, and ZIP code. At least a first or last name is required when manually creating a contact."] },
    { question: "How do I add a new contact?", answer: ["Open Contact Management and select Add Contact. Enter the available information and save. Aether creates the contact record within the active Business organization and opens the new Contact Profile."] },
    { question: "What does the Contact Management dashboard show?", answer: ["The dashboard displays Total Contacts, Filtered Contacts, and Unassigned Contacts. It also provides contact search, selection tools, quick list assignment, CSV export, and navigation to contact creation and imports."] },
    { question: "How does contact search work?", answer: ["Search matches recorded first and last names, email addresses, phone numbers, companies, job titles, cities, states, and ZIP codes. Results update the visible contact table and the Filtered Contacts count."] },
    { question: "Can I filter contacts by location or assigned owner?", answer: ["The current page supports live text search, including searching recorded location information. Dedicated Location and Owner filter controls are displayed but disabled while deeper Business-specific segmentation is developed."] },
    { question: "Can I edit a contact after creating it?", answer: ["Yes. Open the Contact Profile and edit the saved identity, contact, professional, or address information. Changes are saved to the organization's contact record without replacing its separate relationship history."] },
    { question: "What is the Contact Profile?", answer: ["The Contact Profile brings together a customer's identifying information, recorded interactions, scheduled follow-ups, running notes, and list memberships. It serves as the ongoing history of the business relationship."] },
    { question: "How do I record an interaction with a contact?", answer: ["The Contact Profile allows employees to record an interaction under CRM, Dispatch, or Inventory. Supported dispositions include Talked on phone, No answer, Emailed, Responded to Email, Texted, and Responded to text. Saved interactions appear in the contact's history."] },
    { question: "Can I schedule follow-ups for contacts?", answer: ["Yes. Employees can choose a department, follow-up date, and intended action on the Contact Profile. The follow-up is saved as a record and displayed with other scheduled follow-ups. This does not by itself establish an automated reminder or outbound message."] },
    { question: "How do contact notes work?", answer: ["Employees can add free-text notes to a contact's profile. Saved notes remain associated with that contact and are displayed in reverse chronological order with their original timestamps."] },
    { question: "Can a contact belong to multiple lists?", answer: ["Yes. A contact can belong to multiple Business lists. The Contact Profile lets employees review existing memberships, add the contact to another available list, and remove individual list memberships without deleting the contact itself."] },
    { question: "Can I organize multiple contacts into a list at once?", answer: ["Yes. From Contact Management, employees can select individual contacts or all currently visible search results. Selected contacts can be added to an existing list or used to create a new CRM, Dispatch, or Inventory list with an optional due date."] },
    { question: "Can I export contact records?", answer: ["Yes. Export Contacts CSV downloads the contacts currently matching the search. The export includes identity, communication, professional, and address fields. When no search is applied, it exports all contacts loaded into the page."] },
    { question: "Are Business contacts shared with Political Aether?", answer: ["The Business Contact Management pages use Business-specific contact, interaction, follow-up, note, and list records scoped to the active organization. Political campaign-specific segmentation is intentionally not inherited by this workspace."] },
  ];
  const listsItems = [
    { question: "What is Business List Management?", answer: ["Business Lists organizes existing contacts into named workgroups. Lists help employees coordinate department-specific activities while keeping the permanent customer information and relationship history on each Contact Profile."] },
    { question: "How do I create a Business list?", answer: ["Open List Management, enter a list name, select a department, optionally choose a due date, and select Create List. The list is saved to the active Business organization."] },
    { question: "Which departments can lists belong to?", answer: ["Business Lists currently supports CRM, Dispatch, and Inventory. Each list is assigned to one of these departments when created, helping identify the type of work the list is intended to support."] },
    { question: "What does the List Management dashboard display?", answer: ["The dashboard displays Saved Lists, Visible, and Due Dated counts. It also provides the list creation form, searchable Saved Lists table, and access to individual list details."] },
    { question: "How do I find an existing list?", answer: ["Use Search Lists to filter saved lists by name or department. The Visible count updates to reflect the matching results. Open a matching list to view its details and members."] },
    { question: "What information appears on an individual list?", answer: ["Each List Detail page displays the list's name, department, contact count, creator when identifiable, creation date, and optional due date. It also includes list members and tools for adding or removing contacts."] },
    { question: "How do I add contacts to a list?", answer: ["Open the list and use Add Contacts to search available contacts in the active Business organization. Select Add beside a contact to include them in the list. Contacts already on the list are excluded from the available-contact picker."] },
    { question: "Can I remove contacts from a list?", answer: ["Yes. Open the list and select Remove beside the appropriate member. This removes the contact's membership in that list without deleting the underlying Contact Profile or its saved history."] },
    { question: "Can a contact belong to multiple lists?", answer: ["Yes. List memberships are maintained separately, allowing the same contact to participate in multiple workgroups. Removing a contact from one list does not remove them from other lists."] },
    { question: "Can I search within a list?", answer: ["Yes. The List Detail page has separate searches for existing members and available contacts. These searches use recorded names, email addresses, phone numbers, and companies."] },
    { question: "Can I export a Business list?", answer: ["Yes. Select Export CSV from the List Detail page to download the currently displayed matching list members. The file includes names, email, phone, company, job title, and address information. Export is disabled when there are no matching members."] },
    { question: "What is the purpose of a list due date?", answer: ["A due date is an optional planning field recorded with the list. It appears in the list details and contributes to the Due Dated dashboard count. The supplied pages do not establish automatic reminders or overdue enforcement."] },
    { question: "Does creating a list automatically assign or complete work?", answer: ["No. Creating a list establishes its identity, department, and membership structure. Execution, dispositions, and progress tracking belong to separate department workflows; creating a list alone does not automatically perform those activities."] },
  ];
  const importsItems = [
    { question: "What data can I import into Aether Business?", answer: ["Aether Business provides three import centers: Contacts, Finance, and Marketing Analytics. Finance supports two file types—transactions and obligations—within its importer."] },
    { question: "How does the import process work?", answer: ["Open the relevant importer, download its CSV template, prepare your records, upload the completed file, and review validation results. Records are not submitted to Aether until you explicitly select the import action."] },
    { question: "Why should I use an Aether CSV template?", answer: ["Each importer expects specific column names and data formats. The downloadable templates provide the supported structure and help prevent import errors. Finance and Marketing require their exact template header order."] },
    { question: "How do I import Business contacts?", answer: ["Open Import Contacts from Contact Management, download the contact template, and upload your CSV. Aether previews the records, identifies valid and invalid rows, and lets you import the valid contacts into your active Business organization."] },
    { question: "Which contact fields are supported?", answer: ["First Name, Last Name, Email, Phone, Company, Job Title, Street Address, City, State, and ZIP. A first or last name is required for each contact; the remaining fields can be blank."] },
    { question: "What happens when a contact CSV contains invalid rows?", answer: ["The Contacts importer identifies invalid rows and displays their errors. You can proceed with importing valid rows while invalid rows are excluded. If no valid contacts remain, importing is unavailable."] },
    { question: "Does importing contacts automatically merge duplicates?", answer: ["No. The Contacts importer does not automatically deduplicate or merge records with existing contacts. Review your file before importing to avoid creating unwanted duplicate records."] },
    { question: "What can I import into Business Finance?", answer: ["The Finance Import Center supports transactions representing money already received or paid, and obligations representing expected incoming or outgoing payments. Select the appropriate import type before uploading."] },
    { question: "What is the difference between Finance transactions and obligations?", answer: ["Transactions record completed financial movement using a Transaction Date. Obligations record expected movement using a Due Date and are initially imported with an open status. They contribute to different Finance views and workflows."] },
    { question: "What columns are required for Finance imports?", answer: ["Transaction CSVs require Direction, Amount, Transaction Date, Description, and Counterparty. Obligation CSVs require Direction, Amount, Due Date, Description, and Counterparty. Direction must be in or out, Amount must be a non-negative number, dates must use YYYY-MM-DD, and Description cannot be blank."] },
    { question: "What happens if my Finance CSV fails validation?", answer: ["Aether reports problems with headers, column counts, direction, amount, date, or description. The import action stays unavailable until the uploaded file passes validation. Finance does not partially import a file with validation errors."] },
    { question: "How do I import Marketing analytics?", answer: ["Open Analytics Upload from Business Marketing, download the analytics template, populate the platform performance records, and upload the CSV. Once validation succeeds, select Import Analytics to submit the records."] },
    { question: "Which platforms and metrics does Marketing import support?", answer: ["Supported platforms are Facebook, Instagram, X, TikTok, YouTube, and Website. Each row includes Date, Platform, Impressions, Engagement, Clicks, Spend, Positive Sentiment, and Negative Sentiment."] },
    { question: "What validation rules apply to Marketing analytics?", answer: ["Marketing requires the exact template columns in order, a valid date, a supported platform name, and non-negative numeric values for every metric. Any validation error prevents the entire file from being imported."] },
    { question: "Can I review imported data before saving it?", answer: ["Yes. Contacts shows row-level validity and contact details. Finance and Marketing show validation feedback and a preview of up to the first ten rows when the file passes validation. Review the information before confirming import."] },
    { question: "Does importing data automatically connect external services?", answer: ["No. CSV imports are manual data-ingestion workflows. Live integrations are configured separately through the Integrations Hub, and uploading a CSV does not authorize a Google, social media, or other external connection."] },
  ];
  const projectsItems = [
    { question: "What is Projects & Tasks?", answer: ["Projects & Tasks is the shared work-management environment included as a standard part of Aether Business, regardless of which optional departments an organization uses.", "The Work Command Center lets teams organize standalone tasks and larger projects, track progress, assign responsibility, and manage deadlines in one place."] },
    { question: "How does the Work Command Center organize work?", answer: ["The All Work board groups top-level work items into four status lanes: To Do, In Progress, Blocked, and Completed.", "Each compact card summarizes the work item and, when it has nested tasks, shows the number completed and a progress indicator. Select a card to edit its details."] },
    { question: "How do I create a project or task?", answer: ["Select New Work Item at the top of the Work Command Center, or Add item within a board lane.", "Enter a title and, as needed, a description, due date, status, and team-member assignment. A standalone task can become a larger project simply by adding nested steps beneath it."] },
    { question: "What is the Project & Task Hierarchy?", answer: ["The hierarchy below the board is the detailed workspace for organizing parent tasks and their nested steps.", "Expand a parent to see its children, add new steps at any level, open an item to edit it, or change its status directly. Nested tasks can contain further nested tasks."] },
    { question: "Does adding a nested task replace the parent task?", answer: ["No. The original work item keeps its own title, description, status, assignment, and dates.", "Nested steps are additional work beneath that item, allowing a project and its individual responsibilities to be tracked separately."] },
    { question: "How is nested task progress calculated?", answer: ["For a parent with nested work, the board summarizes how many descendant tasks are completed out of the total nested tasks, including steps nested multiple levels deep.", "The progress bar helps employees assess the state of a project without expanding every step on the board. The full hierarchy remains available for detailed updates."] },
    { question: "Can I assign tasks to other team members?", answer: ["Yes. Work items can be assigned to members of the active Business organization. Assignments are saved with the work item and appear in work summaries and responsibility highlights.", "The assignee is a real organization member, not merely a free-text label."] },
    { question: "What does My Tasks show?", answer: ["My Tasks focuses on work assigned to the currently signed-in organization member, rather than requiring an employee to type their own name.", "Use All Work to return to the organization-wide board and hierarchy."] },
    { question: "How are deadlines and completed work tracked?", answer: ["Work items can have due dates, completion dates, and statuses. The Work Command Center summarizes open steps, work due this week, overdue items, and completed steps.", "These indicators use the organization's saved work records to show current workload and progress."] },
    { question: "What are Responsibility Highlights?", answer: ["Responsibility Highlights summarizes active assignments by team member and indicates whether assigned work is overdue.", "This gives managers and employees a quick view of ownership without opening each task individually."] },
    { question: "Will my projects and tasks remain after refreshing the page?", answer: ["Yes. Projects and tasks are saved in the organization's Supabase-backed records and persist across page refreshes.", "Team assignments are also connected to organization members and saved with the relevant work."] },
    { question: "Is Projects & Tasks an optional paid department or a separate Focus Mode?", answer: ["No. Projects & Tasks is a standard Business feature, not one of the five optional departmental modules.", "Its All Work board, My Tasks view, and expandable hierarchy provide the work-management experience directly, without a separate Projects & Tasks Focus Mode."] },
    { question: "How does Projects & Tasks connect to A.B.E. and My Profile?", answer: ["The Business dashboard's A.B.E. summary can include an overall observation about Projects & Tasks based on recorded work activity.", "My Profile can show counts of incomplete and completed work associated with the signed-in employee. Projects & Tasks remains the place to review and manage the underlying work."] },
  ];

  const adminItems = [
    { question: "What is Business Administration?", answer: ["Business Administration is the organization's control center for viewing team membership, provisioned Business modules, department access information, and operational activity. It also provides access to Team Management."] },
    { question: "What does the Administration dashboard show?", answer: ["It displays organization team members and their statuses, available Business modules, role and provisioning guidance, and current activity indicators for provisioned departments."] },
    { question: "Which Business modules can my organization use?", answer: ["The available modules are CRM, Marketing, Inventory, Dispatch, and Finance. Your organization's provisioned modules determine which department workspaces are available."] },
    { question: "How do I request an additional module or remove one?", answer: ["Open the Business Module Inquiry from Administration. You can request modules to be added or removed, or ask a subscription question. The request is sent to Team Aether for review; submitting it does not immediately change provisioning."] },
    { question: "What is Department Activity?", answer: ["Department Activity provides current operational counts from provisioned workspaces, such as CRM follow-ups, unpublished Marketing content, Inventory reorder needs, Dispatch jobs awaiting assignment, and open Finance obligations. It reflects recorded operational data rather than employee productivity scores."] },
    { question: "What is Team Management?", answer: ["Team Management is the administrative workspace for creating organization accounts, reviewing the current team, searching members, and managing their department assignments."] },
    { question: "How do I add a team member?", answer: ["Open Manage Team, enter the employee's email address and an initial password of at least six characters, select Admin or General User, and choose at least one available department. Submit Add Team Member to create the account. Share the initial password securely."] },
    { question: "Can employees work in more than one department?", answer: ["Yes. A team member can be assigned to multiple departments that are provisioned for the organization. Team Management supports multiple department selections when creating an account or editing existing access."] },
    { question: "What is the difference between Admin and General User?", answer: ["Admins can access all Business departments provisioned for the organization. General Users are limited to their assigned, provisioned departments. Actual management actions also depend on the application's permission checks."] },
    { question: "Can I change a team member's department access?", answer: ["Yes. Find the employee in Manage Team, select Edit, choose the provisioned departments they should access, and save. At least one department must remain selected."] },
    { question: "Can I change an existing employee's Admin or General User role?", answer: ["The current Team Management page lets you choose a role when creating an account, but changing an existing member's role is not yet connected to the edit workflow. Existing-member edits currently manage department assignments."] },
    { question: "Can I search the team roster?", answer: ["Yes. Manage Team supports searching members by recorded name, email, role, and department. The roster also shows member counts, assigned departments, and inactive-profile indicators where applicable."] },
    { question: "What is My Profile?", answer: ["My Profile is each employee's personal workspace for viewing their identity, email, organization, title, role, department, accessible departments, and current availability status."] },
    { question: "Can I change my availability status?", answer: ["Yes. My Profile lets you choose Active, Busy, Inactive, Break, Lunch, or Potato. The selection is saved to your organization membership and can be displayed in the organization's team-status views."] },
    { question: "Does changing my profile status change my permissions?", answer: ["No. Availability status describes how teammates see you; it does not change your role, department assignments, or access to provisioned Business modules."] },
    { question: "Can I edit my name, title, or role directly from My Profile?", answer: ["The current My Profile page displays those identity and organization details, but its available editing control is for status. It does not provide direct name, title, or role editing."] },
    { question: "What happens if a department isn't provisioned for my organization?", answer: ["Unprovisioned departments cannot be assigned through the current Team Management controls. Employees can access only the departments available under their organization's provisioning and their applicable role permissions."] },
  ];
  const filteredToolsItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? toolsItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : toolsItems;
  }, [query]);
  const filteredContactsItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? contactsItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : contactsItems;
  }, [query]);
  const filteredListsItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? listsItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : listsItems;
  }, [query]);
  const filteredImportsItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? importsItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : importsItems;
  }, [query]);
  const filteredProjectsItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? projectsItems.filter((item) => item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))) : projectsItems;
  }, [query]);
  const filteredAdminItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? adminItems.filter((item) =>
      item.question.toLowerCase().includes(search) || item.answer.some((paragraph) => paragraph.toLowerCase().includes(search))
    ) : adminItems;
  }, [query]);
  const hasResults = filteredItems.length > 0 || filteredAbeItems.length > 0 || filteredOverviewItems.length > 0 || filteredFocusItems.length > 0 || filteredCrmItems.length > 0 || filteredDispatchItems.length > 0 || filteredFinanceItems.length > 0 || filteredInventoryItems.length > 0 || filteredMarketingItems.length > 0 || filteredToolsItems.length > 0 || filteredContactsItems.length > 0 || filteredListsItems.length > 0 || filteredImportsItems.length > 0 || filteredAdminItems.length > 0 || filteredProjectsItems.length > 0;
  const totalQuestions = faqItems.length + abeItems.length + overviewItems.length + focusItems.length + crmItems.length + dispatchItems.length + financeItems.length + inventoryItems.length + marketingItems.length + toolsItems.length + contactsItems.length + listsItems.length + importsItems.length + adminItems.length + projectsItems.length;
  const [doctrineClicks, setDoctrineClicks] = useState(0);
  const [warningStage, setWarningStage] = useState<0 | 1 | 2 | 3 | 4>(0);

  function handleDoctrineClick() {
    setDoctrineClicks((current) => {
      const next = current + 1;

      if (next >= 33) {
        setWarningStage(1);
        return 0;
      }

      return next;
    });
  }

  function closeWarning() {
    setWarningStage(0);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 px-6 py-12 text-white sm:px-8 lg:px-9 lg:py-9">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-[-10%] top-[-40%] h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute bottom-[-35%] right-[-10%] h-96 w-96 rounded-full bg-purple-500 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100 lg:mb-3 lg:px-2.5 lg:py-0.5 lg:text-[9px]">
              Aether Business FAQ
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-4xl">
              Business Operating System
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg lg:mt-4 lg:text-sm lg:leading-6">
              A modular operating system that meets businesses where they are,
              scales with their needs, and connects work across departments.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur lg:min-w-[315px] lg:gap-2 lg:rounded-2xl lg:p-3">
            <div className="rounded-2xl bg-white/10 p-4 lg:rounded-xl lg:p-3">
              <div className="text-3xl font-black lg:text-2xl">15</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 lg:text-[9px]">Sections</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 lg:rounded-xl lg:p-3">
              <div className="text-3xl font-black lg:text-2xl">{totalQuestions}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 lg:text-[9px]">Questions</div>
            </div>
            <div
              className="cursor-default rounded-2xl bg-white/10 p-4 lg:rounded-xl lg:p-3"
              onClick={handleDoctrineClick}
            >
              <div className="text-3xl font-black lg:text-2xl">OS</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 lg:text-[9px]">
                Doctrine
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-9 lg:py-6">
        <div className="grid gap-6 lg:grid-cols-[255px_1fr] lg:gap-4">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:max-h-[calc(100dvh-3rem)] lg:rounded-2xl lg:p-3">
              <label htmlFor="business-faq-search" className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 lg:text-[9px]">Search FAQ</label>
              <input id="business-faq-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Aether Business..." className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 lg:mt-2 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]" />
              <div className="mt-5 min-h-0 overflow-y-auto overscroll-contain pr-1 lg:mt-4 lg:flex-1">
                <a href="#platform" className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>What is Aether Business?</span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-800">{faqItems.length}</span>
                </a>
                <a href="#abe" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>A.B.E. — Aether Brain Engine</span>
                  <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] text-purple-800">{abeItems.length}</span>
                </a>
                <a href="#overview" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Business Overview</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800">{overviewItems.length}</span>
                </a>
                 <a href="#focus" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                   <span>Focus Mode</span>
                   <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800">{focusItems.length}</span>
                 </a>
                <a href="#crm" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Business CRM</span>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] text-cyan-800">{crmItems.length}</span>
                </a>
                <a href="#dispatch" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Business Dispatch</span>
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-800">{dispatchItems.length}</span>
                </a>
                <a href="#finance" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Business Finance</span>
                  <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] text-green-800">{financeItems.length}</span>
                </a>
                <a href="#inventory" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Business Inventory</span>
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] text-teal-800">{inventoryItems.length}</span>
                </a>
                <a href="#marketing" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Business Marketing</span>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-800">{marketingItems.length}</span>
                </a>
                <a href="#tools" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Tools &amp; Integrations</span>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] text-sky-800">{toolsItems.length}</span>
                </a>
                <a href="#contacts" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Contact Management</span>
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] text-orange-800">{contactsItems.length}</span>
                </a>
                <a href="#lists" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Business Lists</span>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-800">{listsItems.length}</span>
                </a>
                <a href="#imports" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Business Data Imports</span>
                  <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-[10px] text-fuchsia-800">{importsItems.length}</span>
                </a>
                <a href="#projects" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Projects &amp; Tasks</span>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] text-sky-800">{projectsItems.length}</span>
                </a>
                <a href="#admin" className="mt-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:px-2.5 lg:py-2 lg:text-[11px]">
                  <span>Administration, Team &amp; Profiles</span>
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] text-slate-800">{adminItems.length}</span>
                </a>
              </div>
            </div>
          </aside>
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Modularity</div>
                <h2 className="mt-2 text-lg font-black text-slate-950">Start with what you need.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Choose the departments that fit your organization today.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Scalability</div>
                <h2 className="mt-2 text-lg font-black text-slate-950">Grow when you're ready.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Add or remove modules as your operational needs change.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Coordination</div>
                <h2 className="mt-2 text-lg font-black text-slate-950">One operating environment.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Connect specialized departments without losing their individual purpose.</p>
              </div>
            </section>
            {!hasResults ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h2 className="text-xl font-black text-slate-950">No FAQ results found.</h2>
                <p className="mt-2 text-sm text-slate-600">Try searching for modules, scaling, A.B.E., Focus Mode, or operational intelligence.</p>
              </div>
            ) : (
              <>
              {filteredItems.length > 0 && <section id="platform" className="scroll-mt-8 rounded-2xl border border-blue-100 bg-blue-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                  <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Platform</div>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">What is Aether Business?</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A modular business operating system designed to meet organizations where they are, scale with their needs, and coordinate operations across departments.</p>
                </div>
                <div className="space-y-4 lg:space-y-3">
                  {filteredItems.map((item) => (
                    <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                        <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                      </summary>
                      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                        {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                      </div>
                    </details>
                  ))}
                </div>
              </section>}
              {filteredAbeItems.length > 0 && (
                <section id="abe" className="scroll-mt-8 rounded-2xl border border-purple-100 bg-purple-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-purple-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Operational Intelligence</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">A.B.E. — Aether Brain Engine</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Aether's built-in operational interpretation engine, designed to transform real business activity into understandable signals, priorities, and actionable awareness.</p>
                    <p className="mt-3 text-sm font-semibold text-purple-800">Your business generates the data. A.B.E. helps you understand it.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredAbeItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredOverviewItems.length > 0 && (
                <section id="overview" className="scroll-mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Organizational Awareness</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business Overview</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Your organization's central view of operational activity, departmental performance, emerging workload, and business-wide awareness.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredOverviewItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
               {filteredFocusItems.length > 0 && (
                 <section id="focus" className="scroll-mt-8 rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                   <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                     <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Operational Execution</div>
                     <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Focus Mode</h2>
                     <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A structured execution environment that turns real departmental activity, responsibilities, and operational needs into organized work.</p>
                     <p className="mt-3 text-sm font-semibold text-amber-800">Less searching for work. More getting it done.</p>
                   </div>
                   <div className="space-y-4 lg:space-y-3">
                     {filteredFocusItems.map((item) => (
                       <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                         <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                           <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                           <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                         </summary>
                         <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                           {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                         </div>
                       </details>
                     ))}
                   </div>
                 </section>
               )}
              {filteredCrmItems.length > 0 && (
                <section id="crm" className="scroll-mt-8 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Customer Relationships</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business CRM</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Organize customer information, monitor relationship activity, manage follow-ups, and connect customer records to actionable departmental workflows.</p>
                    <p className="mt-3 text-sm font-semibold text-cyan-800">Every relationship has a history. Every next step deserves clarity.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredCrmItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredDispatchItems.length > 0 && (
                <section id="dispatch" className="scroll-mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Operational Coordination</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business Dispatch</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Coordinate service jobs, customer locations, employee assignments, schedules, and operational progress from one centralized workspace.</p>
                    <p className="mt-3 text-sm font-semibold text-indigo-800">The right work. The right people. The right place.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredDispatchItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredFinanceItems.length > 0 && (
                <section id="finance" className="scroll-mt-8 rounded-2xl border border-green-100 bg-green-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-green-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Financial Operations</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business Finance</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Understand financial activity, track expected payments, identify outstanding obligations, and coordinate financial work from one operational workspace.</p>
                    <p className="mt-3 text-sm font-semibold text-green-800">Know what's moving. Know what's owed. Know what comes next.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredFinanceItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredInventoryItems.length > 0 && (
                <section id="inventory" className="scroll-mt-8 rounded-2xl border border-teal-100 bg-teal-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Stock &amp; Purchasing</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business Inventory</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Track inventory, monitor stock availability, manage purchasing, and record incoming deliveries through one coordinated operational workspace.</p>
                    <p className="mt-3 text-sm font-semibold text-teal-800">Know what you have. Know what you need. Know what's coming.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredInventoryItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredMarketingItems.length > 0 && (
                <section id="marketing" className="scroll-mt-8 rounded-2xl border border-rose-100 bg-rose-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-rose-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Marketing Performance &amp; Content Operations</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business Marketing</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Monitor marketing performance across platforms, manage content workflows, understand audience engagement, and review historical activity from one centralized workspace.</p>
                    <p className="mt-3 text-sm font-semibold text-rose-800">Know what's reaching people. Know what's working. Know what comes next.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredMarketingItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredToolsItems.length > 0 && (
                <section id="tools" className="scroll-mt-8 rounded-2xl border border-sky-100 bg-sky-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Workspace Utilities &amp; Connected Systems</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business Tools &amp; Integrations</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Coordinate internal communication, access shared Google workspace tools, and manage external service connections from one business environment.</p>
                    <p className="mt-3 text-sm font-semibold text-sky-800">Keep your team connected. Keep your systems working together.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredToolsItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredContactsItems.length > 0 && (
                <section id="contacts" className="scroll-mt-8 rounded-2xl border border-orange-100 bg-orange-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Customer Records &amp; Relationship History</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business Contact Management</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create and maintain customer records, search contacts, record interactions, schedule follow-ups, and organize relationships across business departments.</p>
                    <p className="mt-3 text-sm font-semibold text-orange-800">Every relationship has a history. Keep it connected.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredContactsItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredListsItems.length > 0 && (
                <section id="lists" className="scroll-mt-8 rounded-2xl border border-violet-100 bg-violet-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Contact Organization &amp; Department Workgroups</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business Lists</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Organize contacts into shared workgroups, assign lists to business departments, and manage membership without changing permanent customer records.</p>
                    <p className="mt-3 text-sm font-semibold text-violet-800">Organize the people. Direct the work. Preserve the relationship.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredListsItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredImportsItems.length > 0 && (
                <section id="imports" className="scroll-mt-8 rounded-2xl border border-fuchsia-100 bg-fuchsia-50/40 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">CSV Uploads, Validation &amp; Data Ingestion</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Business Data Imports</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Bring existing customer, financial, and marketing records into Aether Business using downloadable templates, validation, and review-before-import workflows.</p>
                    <p className="mt-3 text-sm font-semibold text-fuchsia-800">Bring your data. Verify the details. Build on what you know.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredImportsItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredProjectsItems.length > 0 && (
                <section id="projects" className="scroll-mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Organization-wide Work Management</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Projects &amp; Tasks</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Plan work, coordinate team responsibilities, manage nested projects, and track progress from start to finish.</p>
                    <p className="mt-3 text-sm font-semibold text-slate-800">Every project has a plan. Every task has an owner.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredProjectsItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {filteredAdminItems.length > 0 && (
                <section id="admin" className="scroll-mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm sm:p-6 lg:p-[18px]">
                  <div className="mb-6 border-b border-slate-200/70 pb-6 lg:mb-4 lg:pb-4">
                    <div className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-800 lg:px-2.5 lg:py-0.5 lg:text-[9px]">Organization Access, Team Administration &amp; Personal Status</div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">Administration, Team Management &amp; Profiles</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage organizational access, understand department activity, administer team memberships, and keep individual availability visible.</p>
                    <p className="mt-3 text-sm font-semibold text-slate-800">The right people. The right access. One connected team.</p>
                  </div>
                  <div className="space-y-4 lg:space-y-3">
                    {filteredAdminItems.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45">+</span>
                        </summary>
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                          {item.answer.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5">{paragraph}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              </>
            )}
          </div>
        </div>
      </section>

      {warningStage > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur-sm"
          onClick={closeWarning}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-[2rem] border border-red-500/30 bg-[#0B1629] p-8 text-center shadow-2xl lg:max-w-md lg:rounded-2xl lg:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            {warningStage === 1 && (
              <>
                <h2 className="text-3xl font-black text-white lg:text-2xl">
                  Don't click this.
                </h2>
                <button
                  type="button"
                  onClick={() => setWarningStage(2)}
                  className="mt-8 w-full rounded-2xl border border-red-400 bg-red-600 px-6 py-4 text-lg font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-red-500 lg:mt-6 lg:rounded-xl lg:px-4 lg:py-3 lg:text-base"
                >
                  DON'T
                </button>
                <button
                  type="button"
                  onClick={closeWarning}
                  className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300 lg:mt-4 lg:text-[9px]"
                >
                  Close
                </button>
              </>
            )}

            {warningStage === 2 && (
              <>
                <h2 className="text-3xl font-black text-white lg:text-2xl">
                  Seriously...? Final Warning...
                </h2>
                <button
                  type="button"
                  onClick={() => setWarningStage(3)}
                  className="mt-8 w-full rounded-2xl border border-red-400 bg-red-600 px-6 py-4 text-lg font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-red-500 lg:mt-6 lg:rounded-xl lg:px-4 lg:py-3 lg:text-base"
                >
                  DON'T
                </button>
                <button
                  type="button"
                  onClick={closeWarning}
                  className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300 lg:mt-4 lg:text-[9px]"
                >
                  Close
                </button>
              </>
            )}

            {warningStage === 3 && (
              <>
                <div className="text-5xl lg:text-4xl" aria-hidden="true">
                  ⚠️ ⚠️ ⚠️
                </div>
                <h2 className="mt-5 text-3xl font-black uppercase tracking-wide text-red-400 lg:mt-4 lg:text-2xl">
                  Warning
                </h2>
                <button
                  type="button"
                  onClick={() => setWarningStage(4)}
                  className="mt-8 w-full rounded-2xl border border-red-400 bg-red-600 px-6 py-4 text-lg font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-red-500 lg:mt-6 lg:rounded-xl lg:px-4 lg:py-3 lg:text-base"
                >
                  Delete Org
                </button>
                <button
                  type="button"
                  onClick={closeWarning}
                  className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300 lg:mt-4 lg:text-[9px]"
                >
                  Close
                </button>
              </>
            )}

            {warningStage === 4 && (
              <>
                <h2 className="text-3xl font-black text-white lg:text-2xl">
                  You've been warned...
                </h2>
                <audio
                  className="mx-auto mt-8 w-full lg:mt-6"
                  controls
                  preload="metadata"
                  src="/audio/dont-click-this.m4a"
                >
                  Your browser does not support audio playback.
                </audio>
                <button
                  type="button"
                  onClick={closeWarning}
                  className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300 lg:mt-5 lg:text-[9px]"
                >
                  Close
                </button>

              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
