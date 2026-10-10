import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aether Business Documentation | Official Business Operating System Reference",
  description: "Official public reference for Aether Business, including departments, workflows, Projects & Tasks, A.B.E., Focus Mode, and supported integrations.",
  alternates: { canonical: "/aether-academy/business-comprehensive-guide" },
};

const guides = [
  {
    "category": "Getting Started",
    "id": "welcome",
    "title": "Welcome to Aether Business",
    "intro": "Aether Business brings an organization’s essential operational functions into a coordinated environment. Start with the modules your organization actually uses, establish team access, and build reliable records before expecting meaningful trends or operational interpretation.",
    "subhead": "A practical starting sequence",
    "details": [
      "Confirm your organization and enabled modules",
      "Invite team members and assign appropriate roles",
      "Create or import relevant business records",
      "Review departmental dashboards and Focus workflows",
      "Connect only the integrations supported for your organization"
    ]
  },
  {
    "category": "Getting Started",
    "id": "scope",
    "title": "Documentation Scope",
    "intro": "This Academy explains the public-facing behavior and operating philosophy of Aether Business. It is an educational reference, not a promise that every integration or capability is enabled for every organization. Availability depends on provisioned modules, configured connections, and recorded data.",
    "subhead": "What this guide does not expose",
    "details": [
      "Private implementation details, security internals, and proprietary interpretation rules are not published here."
    ]
  },
  {
    "category": "Getting Started",
    "id": "business-os",
    "title": "What is a Business Operating System?",
    "intro": "Aether Business is a modular operating environment. Rather than treating customer relationships, marketing, inventory, dispatch, and finance as unrelated applications, it provides a shared foundation for visibility and coordinated work. A small business can begin with a subset of modules; a larger organization can provision additional departments.",
    "subhead": "The operating principle",
    "details": [
      "Information is recorded in the relevant department, reviewed through dashboards, interpreted where supported by A.B.E., and acted on by employees using departmental workflows."
    ]
  },
  {
    "category": "Platform",
    "id": "abe",
    "title": "A.B.E. — Aether Brain Engine",
    "intro": "A.B.E. is a deterministic operational interpretation layer. It evaluates recorded activity against defined business rules to highlight conditions and potential pressure points. It does not use generative AI or large language models, and it does not invent business activity.",
    "subhead": "People remain responsible",
    "details": [
      "A.B.E. does not autonomously make business decisions or perform departmental work. Departmental visibility depends on the modules enabled for the organization and their records; the Business Overview can also summarize standard Projects & Tasks activity."
    ]
  },
  {
    "category": "Platform",
    "id": "overview",
    "title": "Business Overview",
    "intro": "The Business Hub is the organization’s central awareness environment. It brings together the A.B.E. Business Snapshot, Business Trends, and Operational Analytics. A.B.E. can also summarize organization-wide Projects & Tasks activity. Trends vary by enabled department and use recorded activity rather than fabricated history.",
    "subhead": "Three complementary views",
    "details": [
      "A.B.E. Business Snapshot: written interpretation of supported operational conditions",
      "Business Trends: department-specific activity over time",
      "Operational Analytics: concise indicators from enabled departments"
    ]
  },
  {
    "category": "Platform",
    "id": "focus",
    "title": "Focus Mode",
    "intro": "Focus Mode organizes actionable departmental responsibilities into structured execution lanes. It complements the full department pages: dashboards provide broad visibility, while Focus Mode helps employees work through qualifying records and responsibilities. Empty lanes are legitimate; Aether does not generate fake tasks.",
    "subhead": "Execution by department",
    "details": [
      "CRM: customer lists and follow-ups",
      "Marketing: content, spend, audience response, and history",
      "Inventory: reorder, purchasing, and delivery",
      "Dispatch: assignment, routing, and execution",
      "Finance: receive, pay, and review"
    ]
  },
  {
    "category": "Departments",
    "id": "crm",
    "title": "CRM — Customer Relationships",
    "intro": "Business CRM combines customer records, recorded interactions, follow-up responsibilities, CRM lists, and a Relationship Pipeline. Its dashboard highlights Total Contacts, CRM Lists, Contacted, and Requires Follow-Up. Search supports names, emails, phone numbers, and companies.",
    "subhead": "Working a relationship",
    "details": [
      "Use the Relationship Pipeline to review recent activity, ownership, and next actions. Recorded interaction types include calls, emails, texts, and responses. Filters help surface scheduled follow-ups and contacts awaiting a response."
    ]
  },
  {
    "category": "Departments",
    "id": "marketing",
    "title": "Marketing — Performance & Content",
    "intro": "Business Marketing combines recorded impressions, engagement, spend, sentiment, platform performance, and content workflows. Its Performance Trend chart visualizes available records. Recognized data sources include Meta/Facebook, Instagram, X, TikTok, YouTube, and website analytics; recognition does not mean an integration is connected.",
    "subhead": "Content is a workflow, not autopilot",
    "details": [
      "Marketing Focus Mode includes Content, Spend, Audience Response, and History. A published content record reflects a saved workflow status, not proof that Aether automatically posted to a social network."
    ]
  },
  {
    "category": "Departments",
    "id": "inventory",
    "title": "Inventory — Stock & Purchasing",
    "intro": "Inventory tracks items, quantities on hand, reserved quantities, availability, reorder points, purchase orders, and incoming deliveries. Available stock reflects unreserved on-hand quantity. Teams can define custom fields using text, number, date, or Yes/No values.",
    "subhead": "From low stock to receipt",
    "details": [
      "Reorder Watch highlights items at or below their configured threshold",
      "Purchase orders move through Draft, Ordered, Partially Received, Received, and Cancelled",
      "Deliveries can record partial receipts and tracking information",
      "Recording a receipt updates on-hand stock; finishing a delivery is a separate action"
    ]
  },
  {
    "category": "Departments",
    "id": "dispatch",
    "title": "Dispatch — Jobs & Coordination",
    "intro": "Dispatch organizes jobs, service locations, scheduling, assignments, and operational progress. Jobs can be associated with customers, Dispatch lists, or manually entered addresses. The Command Center shows Active Jobs, Unassigned, In Progress, Route Ready, and Completed.",
    "subhead": "Understand job status",
    "details": [
      "Jobs move through Unassigned, Assigned, Scheduled, In Progress, and Completed. Route Ready means an active job has a recorded service address; it does not mean a route was generated or optimized."
    ]
  },
  {
    "category": "Departments",
    "id": "finance",
    "title": "Finance — Operational Cash Visibility",
    "intro": "Business Finance distinguishes completed transactions from expected incoming and outgoing obligations. The Command Center shows Money In, Money Out, Net, and Outstanding. Financial Flow uses recorded transactions; Financial Attention surfaces open and overdue obligations.",
    "subhead": "Finance is not a replacement accounting ledger",
    "details": [
      "Employees can create obligations through Manual Entry, import supported CSV records, and review recent transactions. Finance Focus Mode organizes Receive, Pay, and Review. Accounting and payment platforms remain systems of record for their respective functions."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "projects-tasks",
    "title": "Projects & Tasks — Planning and Team Execution",
    "intro": "Projects & Tasks is a standard part of Aether Business, available alongside the Business Overview, Tools, and FAQ without purchasing an additional department module. It gives teams a shared workspace to organize projects, break work into individual and nested tasks, assign responsibility, and track progress from planning through completion.",
    "subhead": "From a project plan to completed work",
    "details": [
      "Open Projects & Tasks to review the work dashboard and Kanban board. Organize work by status so teammates can see what is waiting, in progress, blocked, or completed.",
      "Create a project and structure its work with tasks and nested subtasks. The parent-child hierarchy keeps detailed responsibilities connected to the larger effort.",
      "Assign work to one or more organization members. Assignments connect work items to teammates so responsibility is visible across the organization.",
      "Use due dates and recorded completion dates to keep timelines visible. Progress indicators summarize completed work within the relevant project or task hierarchy.",
      "Open My Tasks to focus on work assigned to you. Your Business Profile also displays counts of incomplete and completed assigned tasks.",
      "The Business Overview's A.B.E. snapshot can summarize organization-wide Projects & Tasks activity from recorded work items. A.B.E. interprets existing records; it does not create or complete tasks automatically."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "contacts",
    "title": "Contacts & Customer Records",
    "intro": "Customer records provide a common foundation for relationship management and supported operational workflows. CRM supports searching and reviewing contact profiles; Dispatch can associate jobs with existing customers and their saved service addresses.",
    "subhead": "Keep records meaningful",
    "details": [
      "Record accurate customer information and interactions so other workflows can use the same organizational context without recreating it."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "lists",
    "title": "Lists & Organized Work",
    "intro": "Lists help employees focus on selected groups of records. CRM uses lists for relationship work; Dispatch can use a Dispatch list when creating jobs for multiple customers. The available workflow depends on the department and its permissions.",
    "subhead": "From broad visibility to focused work",
    "details": [
      "Use departmental lists to organize existing records for a specific purpose rather than treating lists as a separate source of truth."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "imports",
    "title": "Imports & Recorded Data",
    "intro": "Aether Business relies on actual organizational records. Business Finance supports CSV import of financial activity; Marketing supports importing analytics records. Dashboards and A.B.E. only interpret data that is available and supported.",
    "subhead": "No manufactured history",
    "details": [
      "When there is insufficient recorded information, the relevant chart or interpretation can show an empty or limited-data state."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "tools",
    "title": "Business Tools",
    "intro": "Business Tools is a shared workspace for internal coordination and everyday utilities. The FAQ describes Business Coordination messaging, Team Status, Google email, calendar and file access, and a route into the Integrations Hub.",
    "subhead": "Connections are conditional",
    "details": [
      "Available connected services depend on the organization’s configuration and supported integrations. A visible platform label does not prove an active connection."
    ]
  },
  {
    "category": "Shared Foundations",
    "id": "integrations-hub",
    "title": "Integrations Hub — Connected Services",
    "intro": "The Aether Business Integrations Hub currently lists Meta, Instagram, X, TikTok, YouTube, Business Website, Google Routes, Gmail, Google Calendar, and Google Drive. It brings supported connection options into one place while making each organization’s connection status visible. Aether is committed to expanding this library as new integrations become ready for business use.",
    "subhead": "Understand the connection before relying on the data",
    "details": [
      "Open the Integrations Hub from Business Tools to inspect the services offered to your organization and their displayed connection status.",
      "Connect only services your organization is authorized to use. An available Connect option does not mean that an account is already linked or that historical information has been imported.",
      "Review the relevant Business department after connecting. A successful authorization and a populated analytics view are different outcomes; supported synchronization and available records determine what appears.",
      "Disconnect a service when your organization no longer wants that connection. Confirm the status afterward and review any workflows that depended on its data.",
      "Use organization administrators and the appropriate service account owners to coordinate access. Do not assume that connecting one service grants access to every account, page, or property under that provider."
    ]
  },
  {
    "category": "Administration",
    "id": "team",
    "title": "Organizations & Team Management",
    "intro": "Aether Business is organized around an active organization and its provisioned departments. Team membership, roles, departments, titles, and profile statuses help describe who participates in the workspace and how work is distributed.",
    "subhead": "A modular environment",
    "details": [
      "Enabled modules determine which departments appear in organizational analytics and which operational information A.B.E. can interpret."
    ]
  },
  {
    "category": "Administration",
    "id": "roles",
    "title": "Roles & Permissions",
    "intro": "Team access and departmental responsibilities should reflect the organization’s actual structure. Administrators manage membership and configuration; employees work in the departmental environments available to them.",
    "subhead": "Use appropriate access",
    "details": [
      "Assign access according to each person’s responsibilities and review it as teams and departments change."
    ]
  },
  {
    "category": "Resources",
    "id": "support",
    "title": "Help, FAQ & Policies",
    "intro": "The Business FAQ provides quick answers; this learning library provides the surrounding operational context. Shared legal and security pages cover both Aether Political and Aether Business.",
    "subhead": "Continue learning",
    "details": [
      "Visit the Business FAQ for specific questions, or the shared Academy for articles, blog updates, and patch notes."
    ]
  }
];


const expandedChapters: Record<string, { heading: string; body: string }[]> = {
  "welcome": [
    {
      "heading": "Your first working session",
      "body": "Begin by confirming which organization you are working in. Check which departments are enabled, who has access, and which records already exist. An empty dashboard is not a malfunction when the organization has not yet entered operational data."
    },
    {
      "heading": "Build the foundation",
      "body": "Have an administrator review membership, roles, and department access. Add or import a small, accurate set of records before introducing large datasets. Use those records to confirm that search, dashboards, and department workflows behave as expected."
    },
    {
      "heading": "A practical first-day sequence",
      "body": "Open Business Overview to understand the organization-wide picture. Visit an enabled department and inspect its Command Center. Complete one legitimate workflow, such as recording a customer interaction or creating a task. Return to Overview and compare what is visible. Invite additional teammates only after you understand their responsibilities."
    },
    {
      "heading": "What success looks like",
      "body": "Your team knows where to find records, who owns work, which modules are available, and where to ask questions. Aether becomes useful through consistent recording and follow-through, not through a one-time setup alone."
    }
  ],
  "scope": [
    {
      "heading": "What this Academy is for",
      "body": "Use these guides to understand concepts, screens, and supported operational workflows. They explain the purpose of each part of Aether Business and offer realistic ways to incorporate it into daily work."
    },
    {
      "heading": "What changes by organization",
      "body": "The five operational departments are modular. A company using CRM and Dispatch will not necessarily see the same departmental tools as a company using Finance and Inventory. Connections to outside services also depend on configuration and authorization."
    },
    {
      "heading": "What recorded information means",
      "body": "A chart represents supported saved activity, not a guarantee that every event in the business has been captured. A status indicates what was recorded in Aether; it should not be treated as independent proof that an outside action occurred."
    },
    {
      "heading": "What remains private",
      "body": "Public documentation does not publish sensitive implementation details, proprietary rule definitions, access-control internals, or private organization data. For precise behavior in your environment, consult the relevant in-app screen and your administrator."
    }
  ],
  "business-os": [
    {
      "heading": "Why an operating system rather than another app",
      "body": "Businesses frequently separate customer follow-ups, service jobs, purchasing, marketing performance, and financial obligations across different tools. Even when those tools work well individually, managers can lose the relationship between information and action."
    },
    {
      "heading": "A shared foundation with modular departments",
      "body": "Aether Business brings enabled departments into one organizational context. Each department retains its own records and workflows, while Business Overview provides a common place to understand supported operational signals. Projects & Tasks supplies shared planning and accountability without being sold as another department module."
    },
    {
      "heading": "The operational loop",
      "body": "Record actual work or import supported data. Review the resulting activity and any relevant A.B.E. observations. Identify what needs attention. Assign or complete work through the appropriate department or Projects & Tasks. Update records so the next review reflects what happened."
    },
    {
      "heading": "A practical example",
      "body": "A service company can use CRM to track a customer relationship, Dispatch to organize a service visit, Inventory to watch required supplies, and Projects & Tasks to coordinate a broader initiative. Those features support a connected operating picture; they do not automatically imply every record is synchronized or every outside service is integrated."
    }
  ],
  "abe": [
    {
      "heading": "Interpretation grounded in records",
      "body": "A.B.E. evaluates supported records using defined deterministic conditions. It can surface operational pressure, outstanding responsibilities, and notable changes when the available data supports those observations. It is not a conversational AI assistant and does not generate fictional history."
    },
    {
      "heading": "What A.B.E. can see",
      "body": "Departmental interpretation depends on which Business modules are provisioned and what they have recorded. The Business Overview can also summarize organization-wide Projects & Tasks activity as a standard capability, including unfinished, completed, and blocked work where recorded."
    },
    {
      "heading": "How to read an observation",
      "body": "Treat a snapshot as a prompt to investigate, not as an instruction to execute blindly. Open the relevant department or Projects & Tasks workspace, verify the underlying records, identify the owner, and decide what action makes sense."
    },
    {
      "heading": "Boundaries and responsibility",
      "body": "A.B.E. does not autonomously assign employees, send messages, place orders, collect payments, or complete tasks. People remain responsible for decisions, execution, and accurate data entry. Limited records can produce limited insight."
    }
  ],
  "overview": [
    {
      "heading": "The purpose of the Business Hub",
      "body": "Overview is a place to orient yourself before diving into individual workstreams. It brings operational signals into a common view while leaving detailed changes and execution in the department or task workspace where those records belong."
    },
    {
      "heading": "A.B.E. Business Snapshot",
      "body": "Read the snapshot for deterministic observations grounded in supported organizational data. Department-specific observations depend on enabled modules. Projects & Tasks may contribute a cross-organization summary of work status."
    },
    {
      "heading": "Business Trends and Operational Analytics",
      "body": "Trends help readers inspect available recorded activity over time; analytics provide more concise departmental indicators. Neither should be interpreted as complete history when the underlying records are missing, incomplete, or outside the supported time window."
    },
    {
      "heading": "A daily review routine",
      "body": "Begin with the snapshot, then inspect trends for the enabled departments most relevant to your role. When an indicator warrants action, open the underlying department or Projects & Tasks, verify the record, and coordinate the next step. Return later to confirm that the record reflects the result."
    }
  ],
  "focus": [
    {
      "heading": "Dashboard versus Focus Mode",
      "body": "A department page gives a broader view of its records, metrics, and tools. Focus Mode narrows attention to actionable items in that department. It is designed for doing work rather than for replacing the department dashboard."
    },
    {
      "heading": "Department-specific lanes",
      "body": "CRM emphasizes follow-ups and relationship work. Marketing organizes content, spend, audience response, and history. Inventory focuses on reorder, purchasing, and deliveries. Dispatch centers on assignment, routing readiness, and execution. Finance organizes receive, pay, and review."
    },
    {
      "heading": "A reliable execution rhythm",
      "body": "Choose an appropriate lane, open a qualifying record, verify its current details, perform the relevant action, and save the outcome. Move to the next item only after recording what happened. If no items qualify, an empty lane is a valid operational state."
    },
    {
      "heading": "How this differs from Projects & Tasks",
      "body": "Projects & Tasks coordinates organization-wide planned work, owners, hierarchy, and deadlines. Focus Mode organizes department-specific execution against the records already in that department. The two views serve different purposes and should not be treated as interchangeable."
    }
  ],
  "crm": [
    {
      "heading": "Begin with the customer record",
      "body": "Use CRM search to find an existing person or company before creating a duplicate. Review available contact information, prior interactions, and follow-up context so that the next conversation begins with the correct history."
    },
    {
      "heading": "Record meaningful interactions",
      "body": "After a call, email, text, or response, save the appropriate interaction and any useful notes. A recorded activity is an internal history entry; it is not proof that an external communication was automatically sent by the platform."
    },
    {
      "heading": "Work the Relationship Pipeline",
      "body": "Use the pipeline to understand relationship activity, ownership, and next steps. Pay attention to contacts requiring follow-up and to scheduled responsibilities. A clear follow-up note should explain the next action, who is responsible, and when it should happen."
    },
    {
      "heading": "Lists and Focus Mode",
      "body": "CRM lists can group records for a particular effort. Focus Mode can help employees work through qualifying follow-ups instead of repeatedly scanning the full customer database."
    },
    {
      "heading": "Practical example",
      "body": "A customer asks for a quote during a phone call. Locate their profile, record the interaction, note the requested follow-up, and use the pipeline or Focus Mode to revisit it. Update the record when the conversation progresses."
    }
  ],
  "marketing": [
    {
      "heading": "Start with the recorded signal",
      "body": "Marketing provides views of supported impressions, engagement, spend, sentiment, and platform activity. Interpret a trend in light of its source and time period; a recognized platform name does not mean an active connection exists."
    },
    {
      "heading": "Understand performance before reacting",
      "body": "Compare available platform metrics and the Performance Trend chart to see whether activity is rising, falling, or remaining steady. Check the completeness of imported or connected data before attributing a change to a campaign decision."
    },
    {
      "heading": "Content Pipeline and status",
      "body": "Use the content workflow to organize planned and recorded content activity. A saved Published status represents a workflow record; it does not independently establish that Aether posted content to an external network."
    },
    {
      "heading": "Focus Mode for daily work",
      "body": "The Content, Spend, Audience Response, and History lanes help separate planning, budget attention, engagement, and review. Save outcomes as work progresses rather than relying on an unrecorded handoff."
    },
    {
      "heading": "Practical example",
      "body": "A marketing lead notices lower recorded engagement. Review the affected platform and date range, examine the available content records, document a proposed adjustment, and assign follow-up work through the appropriate workflow or Projects & Tasks."
    }
  ],
  "inventory": [
    {
      "heading": "Know the difference between quantity fields",
      "body": "On-hand quantity represents recorded stock physically held. Reserved quantity accounts for stock set aside. Available quantity reflects the unreserved portion of on-hand stock. These distinctions matter when deciding whether a new job can be supported."
    },
    {
      "heading": "Set up useful item records",
      "body": "Maintain accurate item names, counts, and reorder thresholds. Custom fields can capture business-specific information using supported text, number, date, and Yes/No values. A threshold is only helpful if receipts and reservations are kept current."
    },
    {
      "heading": "Use Reorder Watch and purchase orders",
      "body": "Reorder Watch identifies items at or below their configured thresholds. Purchase orders move through Draft, Ordered, Partially Received, Received, and Cancelled. Review the purchase order status before assuming a supplier has shipped or delivered anything."
    },
    {
      "heading": "Receive stock carefully",
      "body": "Incoming deliveries can include tracking details and partial receipts. Recording received quantities updates on-hand stock. Completing a delivery is a separate action, so teams should reconcile what actually arrived before closing it."
    },
    {
      "heading": "Practical example",
      "body": "A service team needs supplies for upcoming jobs. Check available quantities, inspect Reorder Watch, create or update the relevant purchase order, and record each delivery receipt as it occurs. Recheck availability before confirming the job can proceed."
    }
  ],
  "dispatch": [
    {
      "heading": "From request to job",
      "body": "Dispatch organizes jobs and work orders with service locations, schedules, and employee assignments. A job can be connected to a customer, created from a Dispatch list, or use a manually entered service address."
    },
    {
      "heading": "Read the Command Center",
      "body": "Active Jobs, Unassigned, In Progress, Route Ready, and Completed help staff see the workload from different angles. These indicators depend on the status and address information actually recorded."
    },
    {
      "heading": "Understand the job lifecycle",
      "body": "The documented sequence includes Unassigned, Assigned, Scheduled, In Progress, and Completed. Move a job through statuses to reflect real operational progress rather than to make the dashboard appear healthier."
    },
    {
      "heading": "Route readiness is not route optimization",
      "body": "Route Ready means an active job has a recorded service address. It does not establish that directions were generated, a driver was dispatched, or a route was optimized."
    },
    {
      "heading": "Practical example",
      "body": "Create a service job, confirm the customer and location, assign an employee, record the schedule, and update the status as work begins and ends. Use Dispatch Focus Mode to review work that needs immediate action."
    }
  ],
  "finance": [
    {
      "heading": "Separate actual movement from expectations",
      "body": "Business Finance distinguishes recorded transactions from open obligations. Money In and Money Out describe completed recorded activity; Outstanding points to expected amounts that still require attention. Net is a summary of recorded inflows and outflows, not a complete accounting statement."
    },
    {
      "heading": "Read the Command Center",
      "body": "Use Money In, Money Out, Net, and Outstanding to orient yourself. Financial Flow shows available transaction history, while Financial Attention highlights obligations that remain open or overdue."
    },
    {
      "heading": "Enter and import records responsibly",
      "body": "Employees can create obligations through Manual Entry and import supported CSV financial activity. Review imported records for accuracy and duplication before relying on the resulting analytics."
    },
    {
      "heading": "Work through Focus Mode",
      "body": "Receive, Pay, and Review organize finance responsibilities. An obligation should be updated to reflect a real-world event; recording an item in Aether is not itself a bank transfer or payment collection."
    },
    {
      "heading": "Practical example",
      "body": "A customer invoice remains unpaid. Review the open obligation, confirm its due date and recorded status, coordinate the appropriate follow-up, and update the obligation after payment is actually received. Keep accounting and payment systems as the relevant systems of record."
    }
  ],
  "projects-tasks": [
    {
      "heading": "Why this is a shared standard feature",
      "body": "Projects & Tasks is included in Aether Business rather than priced as one of the five optional departmental modules. It provides an organization-wide place to plan initiatives, break them into manageable work, and make responsibility visible."
    },
    {
      "heading": "Build a project hierarchy",
      "body": "Start with the larger outcome, then create the tasks required to deliver it. Use nested subtasks when a task needs additional structure. Keeping parent and child items connected makes the relationship between a project and its work easier to understand."
    },
    {
      "heading": "Use the Kanban workflow",
      "body": "Review work in To Do, In Progress, Blocked, and Done states. A blocked item is a signal that an obstacle needs attention; a Done item should reflect completed work, not merely an intention to finish."
    },
    {
      "heading": "Assign people and set expectations",
      "body": "A work item can have multiple organization-member assignments. Use clear titles, useful descriptions, and due dates where appropriate. Confirm that each assignee understands their responsibility rather than assuming an assignment alone communicates all context."
    },
    {
      "heading": "Track progress and personal workload",
      "body": "Progress indicators summarize completion within the relevant hierarchy. My Tasks helps each employee find assigned work; the Business Profile also shows incomplete and completed assigned task counts."
    },
    {
      "heading": "Review with A.B.E. and act",
      "body": "The Business Overview A.B.E. snapshot can summarize organization-wide work status, including unfinished and blocked records. Use that information to inspect specific tasks and coordinate action. A.B.E. does not create, reassign, or complete tasks automatically."
    },
    {
      "heading": "A realistic project example",
      "body": "For an office relocation, create the main project, add tasks for vendors, equipment, scheduling, and communications, assign the appropriate teammates, and set deadlines. Move each task through the Kanban states as work happens. Review project progress and blocked items during team check-ins."
    }
  ],
  "contacts": [
    {
      "heading": "One reliable customer record",
      "body": "Contacts support customer relationships and other enabled workflows. Consistent names, contact details, and company information help employees find the right person and avoid duplicated outreach."
    },
    {
      "heading": "How records support departments",
      "body": "CRM can search and review customer profiles and interactions. Dispatch can associate a job with an existing customer and saved service location. Each department uses the information relevant to its workflow."
    },
    {
      "heading": "Keep information current",
      "body": "Correct outdated contact details when verified, and record meaningful interactions in the appropriate place. A shared record is only useful when the organization maintains it."
    },
    {
      "heading": "Practical example",
      "body": "A returning customer schedules a service visit. Confirm the existing contact profile and address before creating the Dispatch job so the team does not recreate or misidentify the customer."
    }
  ],
  "lists": [
    {
      "heading": "What a list is for",
      "body": "Lists organize selected records for a specific operational purpose. They help a team narrow a broad population into a workable group without replacing the underlying customer records."
    },
    {
      "heading": "CRM and Dispatch examples",
      "body": "CRM can use lists to support relationship work. Dispatch can use a Dispatch list when preparing jobs for multiple customers. Which list workflows are available depends on the department and permissions."
    },
    {
      "heading": "Use lists deliberately",
      "body": "Give a list a clear purpose and review the included records before acting. A list should help the next employee understand why the records were grouped together."
    },
    {
      "heading": "A practical workflow",
      "body": "Identify a set of customers requiring follow-up, organize them through the supported CRM list workflow, and work the resulting records while saving outcomes back to the appropriate customer histories."
    }
  ],
  "imports": [
    {
      "heading": "Why data quality matters",
      "body": "Dashboards and deterministic interpretation depend on recorded information. Incomplete, stale, or duplicated data can distort the picture even when the chart itself is functioning correctly."
    },
    {
      "heading": "Supported import paths",
      "body": "Business Finance supports CSV import of financial activity, and Marketing supports importing analytics records. The available fields and supported formats should be checked in the corresponding in-app workflow."
    },
    {
      "heading": "A safe import routine",
      "body": "Prepare the source file, verify column meaning and date formats, import a small representative sample where practical, and review the resulting records. Correct source issues before attempting larger imports."
    },
    {
      "heading": "Understand empty states",
      "body": "A missing trend can mean there is no supported data for that view or time period. It does not justify inventing historical values. Confirm the relevant source and import status before drawing conclusions."
    }
  ],
  "tools": [
    {
      "heading": "A shared utility workspace",
      "body": "Business Tools brings internal coordination and supported connected services into one place. It complements the operational departments rather than acting as a replacement for CRM, Dispatch, or Projects & Tasks."
    },
    {
      "heading": "Business Coordination and Team Status",
      "body": "Use coordination features for lightweight team communication and awareness. Team Status helps employees understand the available organizational context; the detailed project plan belongs in Projects & Tasks."
    },
    {
      "heading": "Google and other integrations",
      "body": "Supported Gmail, Calendar, and Drive experiences depend on authorization and organizational configuration. The Integrations Hub provides a place to review supported connection options and status."
    },
    {
      "heading": "A practical workflow",
      "body": "Before relying on a connected tool, confirm that the relevant integration is active. Use the tool for its supported purpose, then record operational follow-up in the appropriate Aether department or task workspace."
    },
    {
      "heading": "Important distinction",
      "body": "A visible integration option is not a guarantee that it is connected, that every account is accessible, or that information will automatically move between all modules."
    }
  ],
  "integrations-hub": [
    {
      "heading": "The current integrations library",
      "body": "The Aether Business Integrations Hub currently presents ten service options across Marketing, Dispatch, and Business Operations. These are supported connection options shown in the Hub, not a claim that every provider is connected or actively delivering data for every organization."
    },
    {
      "heading": "Marketing: Meta and Instagram",
      "body": "Meta supports Facebook-related advertising, reach, engagement, and audience activity. Instagram is also listed for reach, engagement, content performance, and audience momentum. Both use the Meta connection flow, so connecting Meta is the starting point for supported Facebook and Instagram analytics."
    },
    {
      "heading": "Marketing: X, TikTok, and YouTube",
      "body": "X supports engagement, replies, and content-performance visibility. TikTok focuses on short-form content performance and audience momentum. YouTube covers video performance and viewing activity. Each requires the relevant provider authorization; YouTube uses a Google authorization flow."
    },
    {
      "heading": "Marketing: Business Website",
      "body": "The Business Website option supports website activity and conversions. Its connection flow can provide an installation snippet for the Aether website tracker to capture supported page views, clicks, and form submissions. Organizations should install the public tracker identifier on their site and keep any private API key server-side rather than embedding it in browser code."
    },
    {
      "heading": "Dispatch: Google Routes",
      "body": "Google Routes is presented as an Aether-managed Dispatch integration for routing and service locations. The Hub describes a service-verification flow rather than requiring each organization to supply its own Google Routes API key or billing setup. Route optimization depends on a working service connection and real job-location data; the availability of the card alone is not proof that routes are being generated."
    },
    {
      "heading": "Business Operations: Gmail, Google Calendar, and Google Drive",
      "body": "Gmail supports business email access, Google Calendar supports schedules and events, and Google Drive supports files and shared assets. These three options share a Google account connection in the Hub. The actual content available in Business Tools depends on the authorized account, permissions, and supported workflows."
    },
    {
      "heading": "How connections are grouped",
      "body": "The Hub displays separate cards for Meta, Instagram, X, TikTok, YouTube, Business Website, Google Routes, Gmail, Google Calendar, and Google Drive. Instagram is managed through Meta; Gmail, Calendar, and Drive share Google authorization. Separate cards help employees understand the services while the underlying provider connection may be shared."
    },
    {
      "heading": "Connect, verify, and manage",
      "body": "Open the Integrations Hub from Business Tools, choose the service, and follow the available authorization or setup instructions. The Hub distinguishes Connected, Ready, Needs Login, and Not Connected states. After connecting, verify the corresponding Marketing, Dispatch, or Business Tools workflow before relying on data. Where supported, Manage Connection provides a path to review or disconnect."
    },
    {
      "heading": "A connection is not a data guarantee",
      "body": "Connected means Aether has recorded a connection for the active organization; it does not guarantee immediate historical analytics, a successful latest sync, access to every account under the provider, or automatic posting. Business and Political use separate product contexts, and an integration in one should not be assumed to be active in the other."
    },
    {
      "heading": "Our commitment to expanding the library",
      "body": "Aether is committed to continually expanding its integrations library so organizations can connect more of the services they already use. We will evaluate additional providers and workflows based on practical business needs, technical feasibility, security, and provider access. New integrations will be documented as they become available; this commitment is not a promise of specific providers or release dates."
    },
    {
      "heading": "Practical example: from connection to action",
      "body": "A marketing manager connects Meta, verifies that the appropriate account is authorized, and then checks Marketing for supported analytics. If the charts lack records, the team checks the connection and synchronization rather than assuming the account has no activity. A separate Projects & Tasks item can track the follow-up investigation."
    }
  ],
  "team": [
    {
      "heading": "Understand the organization context",
      "body": "Aether Business works within an active organization. The organization determines the applicable team membership, department provisioning, and operational records shown in its environment."
    },
    {
      "heading": "Manage membership deliberately",
      "body": "Administrators should keep employee membership, roles, departments, titles, and profile information aligned with the real team. Changes to staffing should prompt an access review."
    },
    {
      "heading": "Modular departments and shared tools",
      "body": "CRM, Marketing, Inventory, Dispatch, and Finance are provisioned operational modules. Business Overview, Tools, FAQ, and Projects & Tasks are shared standard capabilities; their presence should not be confused with an extra departmental subscription."
    },
    {
      "heading": "Practical onboarding",
      "body": "Confirm the employee belongs to the intended organization, set the appropriate role and department, explain the enabled tools, and verify that the employee can access the workflows they need."
    }
  ],
  "roles": [
    {
      "heading": "Why permissions matter",
      "body": "A shared operating environment still needs clear responsibility. Roles and department assignments help define who should manage configuration and who should perform everyday operational work."
    },
    {
      "heading": "Administrator responsibilities",
      "body": "Administrators manage organization membership and configuration. They should periodically review who has access and whether team records still reflect the current organization."
    },
    {
      "heading": "Employee responsibilities",
      "body": "Employees should use the workflows available to them, maintain accurate records, and escalate access needs through the appropriate administrator rather than sharing credentials or working around controls."
    },
    {
      "heading": "A practical access review",
      "body": "When someone changes departments or leaves the organization, review their membership and responsibilities. Check whether assigned work also needs reassignment so tasks do not become stranded."
    }
  ],
  "support": [
    {
      "heading": "Choose the right resource",
      "body": "Use the Business FAQ for short answers, the Business Academy for guided explanations, and Business training videos for walkthroughs as they are published. The shared Academy also contains articles, blog posts, and patch notes."
    },
    {
      "heading": "Troubleshoot from the actual record",
      "body": "If a metric or workflow seems wrong, first confirm the active organization, enabled module, relevant dates, and available records. Distinguish a missing record from a failed action before escalating."
    },
    {
      "heading": "Respect the boundaries of public guidance",
      "body": "Legal, privacy, and security pages provide the published policy context. Public guides intentionally avoid private implementation details and do not promise integrations that have not been enabled."
    },
    {
      "heading": "Keep learning as the platform changes",
      "body": "Operational practices evolve. Revisit the relevant guide after a feature update and use the most current in-app behavior when validating a workflow."
    }
  ]
};

export default function BusinessComprehensiveGuidePage() {
  return (
    <main id="top" className="min-h-screen bg-[#07111f] text-slate-300">
      <header className="mx-auto max-w-4xl px-6 pb-12 pt-12 sm:pt-16">
        <Image src="/aether-logo-full.png" alt="Aether" width={260} height={72} priority className="h-auto w-56" />
        <h1 className="mt-12 text-4xl font-bold text-white sm:text-5xl">Aether Business Documentation</h1>
        <p className="mt-3 text-lg text-slate-400">Official Reference Manual</p>
      </header>
      <section className="mx-auto max-w-4xl px-6 pb-12">
        <h2 className="border-b border-slate-700 pb-3 text-2xl font-bold text-white">Official Documentation</h2>
        <div className="mt-6 space-y-4 leading-8">
          <p>This document is the official public reference for the <strong className="text-white">Aether Business Operating System</strong>.</p>
          <p>It serves as the canonical source for Aether Business workflows, departments, features, integrations, and operational philosophy. The information in this guide is maintained by Team Aether and reflects the intended behavior and purpose of the platform.</p>
          <p>This guide is intended for business teams, organization administrators, partners, developers, researchers, and AI systems seeking an accurate understanding of Aether Business. Capabilities depend on enabled modules, organizational configuration, supported integrations, and recorded operational data.</p>
          <p>Unless superseded by official release notes or updated documentation, this guide should be considered the authoritative public documentation for Aether Business.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="border-b border-slate-700 pb-3 text-2xl font-bold text-white">Contents</h2>
        <ol className="mt-6 list-decimal space-y-2 pl-6">
          {guides.map((guide) => <li key={guide.id}><a href={`#${guide.id}`} className="underline underline-offset-4 hover:text-white">{guide.title}</a></li>)}
        </ol>
      </section>
      <section className="mx-auto max-w-4xl px-6 pb-24">
        {guides.map((guide) => (
          <article key={guide.id} id={guide.id} className="border-t border-slate-700 py-12 first:border-t-0">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{guide.title}</h2>
            <p className="mt-8 text-lg leading-8">{guide.intro}</p>
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white">{guide.subhead}</h3>
              {guide.details.length > 1 ? (
                <ul className="mt-4 list-disc space-y-3 pl-6">{guide.details.map((detail) => <li key={detail} className="leading-8">{detail}</li>)}</ul>
              ) : <p className="mt-4 leading-8">{guide.details[0]}</p>}
            </div>
            {(expandedChapters[guide.id] ?? []).map((section) => (
              <section key={section.heading} className="mt-8">
                <h3 className="text-xl font-bold text-white">{section.heading}</h3>
                <p className="mt-3 leading-8">{section.body}</p>
              </section>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}
