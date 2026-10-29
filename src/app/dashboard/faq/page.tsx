"use client";

import { useMemo, useState } from "react";

type FAQItem = {
  question: string;
  answer: string[];
};

type FAQSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  tone: "navy" | "purple" | "green" | "amber" | "rose" | "slate";
  items: FAQItem[];
};

const faqSections: FAQSection[] = [
  {
    "id": "welcome-to-aether",
    "eyebrow": "Political Academy",
    "title": "Getting Started",
    "description": "Practical guidance from the Aether Political Academy on getting started.",
    "tone": "navy",
    "items": [
      {
        "question": "What should I know about Getting Started?",
        "answer": [
          "Welcome to the Aether Campaign Operating System. Whether you're launching a campaign for the first time or transitioning from another platform, we're excited to be part of your team.",
          "Aether was built to help campaigns stay organized, work together more effectively, and spend less time managing software so they can spend more time connecting with voters and supporters."
        ]
      },
      {
        "question": "How does getting Started work in Getting Started?",
        "answer": [
          "If you're just getting started, we recommend following these steps:",
          "• Invite your team members.",
          "• Assign roles and departments.",
          "• Import your contacts and campaign data.",
          "• Connect your campaign's integrations."
        ]
      },
      {
        "question": "How does continue Learning work in Getting Started?",
        "answer": [
          "The Aether Academy is designed to grow alongside the platform.",
          "As new features are introduced and existing workflows evolve, the Academy will continue expanding with updated guides, best practices, and operational resources to help your campaign get the most out of Aether.",
          "If you ever have a quick question, don't forget to visit the Frequently Asked Questions section for fast answers to common topics."
        ]
      },
      {
        "question": "How does we're Here to Help work in Getting Started?",
        "answer": [
          "Running a campaign is challenging, and we believe your software should be backed by a team that's invested in your success.",
          "If you have questions, ideas, or feedback, Team Aether would love to hear from you. Whether you've found an opportunity to improve Aether, have a feature you'd like to see, or simply need assistance getting the most out of the platform, we're always happy to help.",
          "Your feedback plays an important role in shaping Aether's future, and many of the improvements made to the platform come directly from the campaigns that use it every day.",
          "Clarity. Focus. Execution.",
          "Thank you for choosing Aether."
        ]
      }
    ]
  },
  {
    "id": "what-is-aether",
    "eyebrow": "Political Academy",
    "title": "Campaign OS",
    "description": "Practical guidance from the Aether Political Academy on campaign os.",
    "tone": "purple",
    "items": [
      {
        "question": "What should I know about Campaign OS?",
        "answer": [
          "Most campaign software is designed to solve a single problem.",
          "One application helps you raise money. Another helps you knock doors. Another manages volunteers. Another tracks digital advertising. Another stores contacts.",
          "Each platform often comes with its own subscription, implementation, training, and operational cost. As campaigns grow, those costs add up—not just financially, but in the time spent switching between systems, reconciling data, and keeping departments aligned."
        ]
      },
      {
        "question": "How does aether was built to solve a different problem. work in Campaign OS?",
        "answer": [
          "Rather than creating another campaign tool, Aether was designed as a Campaign Operating System—a single platform where every major department can operate together.",
          "Finance, Field, Outreach, Digital, and Print all work from the same foundation. Contacts, lists, tasks, operational metrics, and campaign intelligence exist in one shared environment instead of being scattered across multiple applications."
        ]
      },
      {
        "question": "How does one Shared Operating Picture work in Campaign OS?",
        "answer": [
          "This creates a campaign where information moves naturally between departments instead of becoming trapped inside them.",
          "• A finance director can understand how fundraising affects field operations.",
          "• A field director can see how volunteer activity impacts campaign priorities.",
          "• Leadership gains a single operational picture instead of trying to combine reports from five different systems."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Campaign OS?",
        "answer": [
          "The goal is not simply to organize information. The goal is to improve execution.",
          "Campaigns succeed because people consistently execute the right work at the right time. Aether exists to make that execution easier by reducing operational friction, improving coordination, and giving campaign teams a common operating picture.",
          "In short, Aether is not a collection of campaign tools. It is the operating system that brings them together."
        ]
      }
    ]
  },
  {
    "id": "campaign-os",
    "eyebrow": "Political Academy",
    "title": "Campaign Operations",
    "description": "Practical guidance from the Aether Political Academy on campaign operations.",
    "tone": "green",
    "items": [
      {
        "question": "What should I know about Campaign Operations?",
        "answer": [
          "A campaign is more than a collection of departments. It is a living organization made up of people, information, priorities, and constant decision-making.",
          "Every day, finance teams raise money, field organizers knock doors, digital teams publish content, outreach teams build relationships, print teams prepare campaign materials, and leadership makes strategic decisions that affect every part of the organization.",
          "Traditionally, each department operates inside its own software. Every additional platform introduces another subscription, another login, another dataset, and another operational cost. As campaigns grow, those costs compound—not only financially, but operationally."
        ]
      },
      {
        "question": "How does a Campaign Operating System approaches that challenge differently. work in Campaign Operations?",
        "answer": [
          "Rather than treating every department as its own isolated workflow, a Campaign Operating System provides a shared operational foundation where the entire campaign works together inside a single environment.",
          "Contacts exist once. Lists exist once. Tasks, operational metrics, campaign activity, and organizational knowledge are shared across every department instead of being duplicated between multiple platforms."
        ]
      },
      {
        "question": "How does one Connected Organization work in Campaign Operations?",
        "answer": [
          "Finance, Field, Outreach, Digital, and Print operate independently while remaining connected to the same operational picture.",
          "• Finance can conduct donor call time while Field builds walking lists.",
          "• Print can prepare literature before volunteers reach the doors.",
          "• Digital contributes campaign activity without operating in isolation.",
          "• Leadership sees one campaign operating together instead of combining reports from multiple systems."
        ]
      },
      {
        "question": "How does the Operational Loop work in Campaign Operations?",
        "answer": [
          "• Information enters the system.",
          "• Results are measured.",
          "• New priorities are identified.",
          "• The campaign learns, and the process begins again."
        ]
      },
      {
        "question": "How does honest Abe work in Campaign Operations?",
        "answer": [
          "Because every department operates from the same foundation, Honest Abe can interpret information across the entire campaign rather than within isolated departments. Abe identifies operational pressure, highlights dependencies, and helps leadership understand what matters most next."
        ]
      },
      {
        "question": "How does the Philosophy Behind Aether work in Campaign Operations?",
        "answer": [
          "A Campaign Operating System is not defined by the number of features it contains. It is defined by how effectively it helps an organization operate as one connected team.",
          "It is not simply a place where campaign work is recorded. It is the operating system that helps a campaign execute as one connected organization."
        ]
      }
    ]
  },
  {
    "id": "design-philosophy",
    "eyebrow": "Political Academy",
    "title": "Design Philosophy",
    "description": "Practical guidance from the Aether Political Academy on design philosophy.",
    "tone": "amber",
    "items": [
      {
        "question": "What should I know about Design Philosophy?",
        "answer": [
          "Every piece of software reflects the priorities of the people who build it. Every workflow, page, and system inside Aether was designed around a single question:",
          "How can we make campaigns easier to execute?",
          "Campaigns are fast-moving organizations. Software should reduce that complexity—not add to it. That belief became the foundation of Aether's design philosophy."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Design Philosophy?",
        "answer": [
          "Campaign teams need accurate, connected information that is easy to find.",
          "Reduce noise and help every department identify its highest priorities.",
          "Software exists to make campaign work easier—not replace it."
        ]
      },
      {
        "question": "How does everything Is a Loop work in Design Philosophy?",
        "answer": [
          "• Information enters the system.",
          "• It is interpreted.",
          "• Results are measured.",
          "• The process begins again."
        ]
      },
      {
        "question": "How does one Campaign, Not Five Departments work in Design Philosophy?",
        "answer": [
          "Departments remain specialized. The campaign remains unified. Finance, Field, Outreach, Digital, Print, and Leadership all contribute to a single operational picture instead of operating in isolation."
        ]
      },
      {
        "question": "How does clarity Through Context work in Design Philosophy?",
        "answer": [
          "Aether does not remove complexity—it contextualizes it. Different users, roles, and subscription tiers see the tools they need when they need them, reducing cognitive load while preserving capability.",
          "Clarity is achieved not by removing features. It is achieved by providing the right context."
        ]
      },
      {
        "question": "How does technology Should Support People work in Design Philosophy?",
        "answer": [
          "Technology should remove friction, simplify coordination, and help campaign staff spend less time managing software and more time accomplishing meaningful work. Honest Abe, execution loops, contextual interfaces, and cross-department visibility all exist to help campaigns make better decisions and execute with greater confidence."
        ]
      },
      {
        "question": "How does software Should Adapt to the Campaign work in Design Philosophy?",
        "answer": [
          "Every campaign is different. Features are introduced when they create value, complexity is revealed only when it becomes useful, and information flows between departments instead of becoming isolated.",
          "The software serves the campaign. The campaign should never have to serve the software."
        ]
      }
    ]
  },
  {
    "id": "honest-abe",
    "eyebrow": "Political Academy",
    "title": "Honest Abe",
    "description": "Practical guidance from the Aether Political Academy on honest abe.",
    "tone": "rose",
    "items": [
      {
        "question": "How does a Strategy Engine, Not an AI Assistant work in Honest Abe?",
        "answer": [
          "Despite its name, Honest Abe was never designed to be an artificial intelligence assistant. At its core, Honest Abe is a campaign strategy engine built to continuously interpret campaign operations, identify opportunities, recognize operational pressure, and help keep work moving throughout the organization."
        ]
      },
      {
        "question": "How does built Around Campaign Strategy work in Honest Abe?",
        "answer": [
          "Rather than answering questions like a chatbot, Abe continuously evaluates how the campaign is operating and helps ensure the right work reaches the right people at the right time. Its purpose is not conversation. Its purpose is execution.",
          "Because Aether operates as one connected Campaign Operating System, Abe can interpret performance metrics and operational activity across Finance, Field, Outreach, Digital, Print, and the organization as a whole. That broader picture helps Abe understand not simply whether an individual metric is rising or falling, but how activity across the campaign may affect its current priorities."
        ]
      },
      {
        "question": "How does campaign Stage Changes What Matters work in Honest Abe?",
        "answer": [
          "Campaign priorities are not static. What deserves attention early in a campaign may be very different from what matters as Election Day approaches.",
          "Organization Administrators control Honest Abe's campaign stage and can move the organization between Early Campaign, Mid Campaign, and Late Campaign as the campaign progresses.",
          "Campaign stage changes the strategic context Abe applies when interpreting campaign performance. As the campaign moves through the election cycle, the relative importance of different operational areas shifts with it, allowing Abe's guidance to reflect what matters to the campaign now rather than applying one static definition of success throughout the entire race.",
          "The underlying weighting systems, thresholds, prioritization methods, and decision logic used by Honest Abe are proprietary to Aether."
        ]
      },
      {
        "question": "How does quietly Keeping Work Moving work in Honest Abe?",
        "answer": [
          "Most of the time, Abe works quietly behind the scenes—routing work, keeping information flowing between departments, and reducing unnecessary coordination so campaign teams can focus on execution instead of administration.",
          "As campaign performance changes, Abe's priorities can change with it. Strong performance in one area, emerging pressure in another, or changing relationships between departments can affect what Abe believes deserves leadership's attention next.",
          "A shift in priority does not necessarily mean something is wrong. It means Abe is continuously interpreting the campaign's current operational picture within the strategic context established by campaign leadership."
        ]
      },
      {
        "question": "How does finding Opportunities Hidden in the Data work in Honest Abe?",
        "answer": [
          "Honest Abe connects imported contacts, voter files, contribution history, department activity, and campaign metrics to surface relationships that might otherwise go unnoticed.",
          "That can mean identifying operational pressure, recognizing relationships between departments, surfacing opportunities that deserve additional attention, or helping leadership understand where campaign resources may have greater strategic value.",
          "The campaign remains in control—Abe helps make those opportunities easier to discover and understand."
        ]
      },
      {
        "question": "How does human Judgment Always Comes First work in Honest Abe?",
        "answer": [
          "Campaign professionals remain responsible for setting priorities and making strategic decisions. Honest Abe provides operational awareness and strategic guidance, not autonomous campaign strategy.",
          "That human control exists at multiple levels. Organization Administrators establish the campaign stage that provides Abe's strategic context, and campaign leadership determines whether Abe's recommendations make sense within the political, organizational, and human realities of the campaign.",
          "Abe can identify what deserves attention. The campaign decides what to do about it."
        ]
      },
      {
        "question": "Why “Honest Abe”?",
        "answer": [
          "Campaign leaders need software that helps them understand what they need to know—not simply what they want to hear.",
          "Honest Abe was designed to think about the operational health of the campaign, recognize when the campaign's needs are changing, and help leadership understand what deserves attention next—so campaign teams can spend more time leading and executing."
        ]
      }
    ]
  },
  {
    "id": "dashboard",
    "eyebrow": "Political Academy",
    "title": "Dashboard",
    "description": "Practical guidance from the Aether Political Academy on dashboard.",
    "tone": "slate",
    "items": [
      {
        "question": "What should I know about Dashboard?",
        "answer": [
          "Every campaign generates information. The purpose of a dashboard is not simply to display those numbers. Its purpose is to transform campaign activity into operational awareness."
        ]
      },
      {
        "question": "How does department Intelligence work in Dashboard?",
        "answer": [
          "Every major department inside Aether has its own dashboard designed around its responsibilities. Finance, Field, Outreach, Digital, and Print each receive analytics focused on helping that department make better operational decisions."
        ]
      },
      {
        "question": "How does cross-Domain Intelligence work in Dashboard?",
        "answer": [
          "Because every department operates inside the same Campaign Operating System, Aether surfaces operational relationships that traditional reporting tools often miss.",
          "• Print production affecting upcoming field operations.",
          "• Volunteer capacity influencing outreach efforts.",
          "• Campaign activity contributing to fundraising momentum."
        ]
      },
      {
        "question": "How does honest Abe Across the Platform work in Dashboard?",
        "answer": [
          "Every department dashboard includes department-specific strategic observations, while the Overview Dashboard expands to interpret the health of the campaign as a whole."
        ]
      },
      {
        "question": "How does the Overview Dashboard work in Dashboard?",
        "answer": [
          "The Overview Dashboard provides leadership with a unified view of campaign health through summary cards and campaign-wide analytics spanning Finance, Field, Outreach, Digital, and Print."
        ]
      },
      {
        "question": "How does designed for Better Decisions work in Dashboard?",
        "answer": [
          "Every visualization, metric, and operational indicator exists for one reason: to support better decisions. Together, Aether's dashboards transform campaign activity into operational awareness so every level of the organization can execute with confidence."
        ]
      }
    ]
  },
  {
    "id": "focus-mode",
    "eyebrow": "Political Academy",
    "title": "Focus Mode",
    "description": "Practical guidance from the Aether Political Academy on focus mode.",
    "tone": "navy",
    "items": [
      {
        "question": "What should I know about Focus Mode?",
        "answer": [
          "Every campaign has work that needs to be completed. Focus Mode was designed around a simple question:",
          "What should you be working on right now?"
        ]
      },
      {
        "question": "How does one Task at a Time work in Focus Mode?",
        "answer": [
          "Rather than presenting hundreds of records, lists, and competing priorities, Focus Mode narrows attention to the work immediately in front of the user."
        ]
      },
      {
        "question": "How does built Around Execution work in Focus Mode?",
        "answer": [
          "• Information is collected.",
          "• Work is interpreted.",
          "• Tasks are organized.",
          "• Assignments are prepared.",
          "• Progress is measured."
        ]
      },
      {
        "question": "How does focused at Every Level work in Focus Mode?",
        "answer": [
          "Every department has its own Focus Mode experience, while campaign leadership receives a version built around coordination, prioritization, delegation, and organizational execution."
        ]
      },
      {
        "question": "How does context Without Distraction work in Focus Mode?",
        "answer": [
          "Focus Mode does not hide information—it prioritizes it. Relevant history and context remain available while navigation, analytics, and administrative tools step into the background to reduce cognitive load."
        ]
      },
      {
        "question": "How does guided, Not Controlled work in Focus Mode?",
        "answer": [
          "Campaign professionals remain in control. Focus Mode guides work, removes the friction of deciding what comes next, and allows staff to spend more time executing meaningful work."
        ]
      },
      {
        "question": "How does connected to the Entire Campaign work in Focus Mode?",
        "answer": [
          "Every completed task immediately strengthens the campaign's operational picture. Dashboards update, analytics evolve, Honest Abe gains additional context, and leadership gains greater visibility."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Focus Mode?",
        "answer": [
          "Focus Mode reduces complexity without reducing capability, provides context without distraction, and guides execution without replacing human judgment."
        ]
      }
    ]
  },
  {
    "id": "aether-mobile",
    "eyebrow": "Political Academy",
    "title": "Aether Mobile",
    "description": "Practical guidance from the Aether Political Academy on aether mobile.",
    "tone": "purple",
    "items": [
      {
        "question": "What should I know about Aether Mobile?",
        "answer": [
          "Campaign work doesn't stop when you leave the office. Aether Mobile extends the Campaign Operating System beyond the desktop, allowing campaign teams to stay connected and execute work wherever it happens."
        ]
      },
      {
        "question": "How does built for Execution work in Aether Mobile?",
        "answer": [
          "The desktop experience is designed for planning and strategy. Aether Mobile is designed for execution, streamlining daily campaign work instead of recreating every desktop feature on a smaller screen."
        ]
      },
      {
        "question": "How does search and Manage Contacts work in Aether Mobile?",
        "answer": [
          "Quickly search existing contacts, review information, update records, and add new contacts from fundraisers, parades, community events, or wherever valuable information is collected."
        ]
      },
      {
        "question": "How does finance, Outreach, and Field work in Aether Mobile?",
        "answer": [
          "Assigned Finance, Outreach, and Field lists are organized for rapid execution, allowing campaign staff to record dispositions, notes, and activity while moving efficiently from one conversation to the next."
        ]
      },
      {
        "question": "How does connected in Real Time work in Aether Mobile?",
        "answer": [
          "Notes, dispositions, new contacts, and completed work synchronize immediately with the campaign, ensuring every authorized team member operates from the same source of truth."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Aether Mobile?",
        "answer": [
          "Campaigns aren't won from behind a computer. They're won through conversations, relationships, and consistent execution in the real world. Aether Mobile brings the Campaign Operating System into the field so your team can stay organized, capture important information, and keep the campaign moving wherever the work takes them."
        ]
      }
    ]
  },
  {
    "id": "finance",
    "eyebrow": "Departments",
    "title": "Finance",
    "description": "Practical guidance from the Aether Political Academy on finance.",
    "tone": "green",
    "items": [
      {
        "question": "What should I know about Finance?",
        "answer": [
          "Every campaign is built on relationships. Donors provide the resources that allow campaigns to communicate, organize, and compete. Aether's Finance department was built to strengthen those relationships while helping fundraising teams execute with confidence."
        ]
      },
      {
        "question": "How does Finance manage donor relationships?",
        "answer": [
          "Every contribution represents a relationship. Every pledge represents a future opportunity. Every conversation helps campaign teams better understand the people investing in the campaign's success."
        ]
      },
      {
        "question": "How does Finance organize donor call time?",
        "answer": [
          "Donor lists can be built around fundraising goals, giving history, campaign priorities, or custom criteria. Focus Mode then guides finance staff through donor outreach one conversation at a time."
        ]
      },
      {
        "question": "What information is available in a donor profile?",
        "answer": [
          "Contribution history, pledge tracking, running notes, previous interactions, contact information, and campaign activity are brought together into a single donor profile so every conversation begins with context."
        ]
      },
      {
        "question": "What is the Jackpot Engine and Jackpot Calling List?",
        "answer": [
          "Using campaign activity, donor history, and current FEC contribution data, Honest Abe helps score and prioritize fundraising opportunities. The resulting Jackpot Calling List complements—not replaces—the custom lists created by campaign staff."
        ]
      },
      {
        "question": "What fundraising analytics are available?",
        "answer": [
          "Finance dashboards provide fundraising analytics, pledge trends, operational intelligence, and department-specific observations from Honest Abe while maintaining visibility into how fundraising connects with the rest of the campaign."
        ]
      },
      {
        "question": "How does Finance prepare contribution records for compliance?",
        "answer": [
          "Contribution records are collected as part of everyday workflow. Before export, Aether validates required reporting information and converts missing data into actionable Focus Mode tasks instead of producing incomplete exports."
        ]
      },
      {
        "question": "How does built to Work Alongside Your Campaign work in Finance?",
        "answer": [
          "Whether your organization emphasizes call time, events, major donors, digital fundraising, or community outreach, Aether adapts to your fundraising strategy rather than forcing a single workflow."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Finance?",
        "answer": [
          "Aether's Finance department combines relationship management, focused execution, opportunity discovery, operational intelligence, and compliance readiness into one connected workflow designed to help campaigns build the financial foundation needed to achieve their goals."
        ]
      }
    ]
  },
  {
    "id": "field",
    "eyebrow": "Departments",
    "title": "Field",
    "description": "Practical guidance from the Aether Political Academy on field.",
    "tone": "amber",
    "items": [
      {
        "question": "What should I know about Field?",
        "answer": [
          "Campaigns are built one conversation at a time. The Field department helps campaigns organize canvassing efforts, execute them efficiently, and ensure every voter interaction strengthens the campaign as a whole."
        ]
      },
      {
        "question": "How does organizing the Work work in Field?",
        "answer": [
          "Field lists can be created around geography, voter characteristics, campaign priorities, or custom criteria. Focus Mode then turns that plan into action—one address, one conversation, and one voter at a time."
        ]
      },
      {
        "question": "How does every Conversation Matters work in Field?",
        "answer": [
          "Supporters, volunteers, yard sign requests, and voter issues all become part of the campaign's shared operational knowledge, helping every department better understand the communities they serve."
        ]
      },
      {
        "question": "How does one Campaign. One Platform. work in Field?",
        "answer": [
          "Field teams operate within the same Campaign Operating System as Finance, Outreach, Digital, Print, and Leadership. Every conversation immediately becomes available to the rest of the campaign, creating one connected operational picture."
        ]
      },
      {
        "question": "How does built for the Real World work in Field?",
        "answer": [
          "Whether knocking doors or attending community events, Aether Mobile allows campaign staff to search contacts, work assigned lists, record conversations, and update voter information directly from the field."
        ]
      },
      {
        "question": "How does intelligence That Improves Every Pass work in Field?",
        "answer": [
          "Every round of canvassing creates new information. Honest Abe and the Campaign Operating System transform those insights into better lists, improved strategy, and stronger execution on every future pass."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Field?",
        "answer": [
          "Aether doesn't change the fundamentals of canvassing. It ensures every conversation contributes to something larger, helping every interaction strengthen the entire campaign."
        ]
      }
    ]
  },
  {
    "id": "outreach",
    "eyebrow": "Departments",
    "title": "Outreach",
    "description": "Practical guidance from the Aether Political Academy on outreach.",
    "tone": "rose",
    "items": [
      {
        "question": "What should I know about Outreach?",
        "answer": [
          "Every campaign creates opportunities. The Outreach department helps campaigns maintain that momentum by ensuring every conversation has the opportunity to become something more."
        ]
      },
      {
        "question": "How does every Conversation Deserves a Response work in Outreach?",
        "answer": [
          "Whether someone requested information, attended an event, expressed interest in volunteering, or simply needs a follow-up call, Outreach organizes ongoing relationships so opportunities aren't forgotten."
        ]
      },
      {
        "question": "How does organized Around Momentum work in Outreach?",
        "answer": [
          "Lists can be built around volunteer recruitment, event follow-up, supporter engagement, community outreach, or any campaign objective. Focus Mode then guides staff through each interaction one conversation at a time."
        ]
      },
      {
        "question": "How does connecting Every Department work in Outreach?",
        "answer": [
          "Finance, Field, Digital, and events all create opportunities that Outreach carries forward. Because every department shares the same contact database, information flows naturally without disconnected systems or duplicate work."
        ]
      },
      {
        "question": "How does built Around Relationships work in Outreach?",
        "answer": [
          "Running notes, previous interactions, contact history, and campaign activity remain connected to every contact, allowing conversations to continue where they last ended instead of starting over."
        ]
      },
      {
        "question": "How does intelligence That Keeps Campaigns Moving work in Outreach?",
        "answer": [
          "The Outreach Dashboard monitors engagement, follow-up progress, and operational health while Honest Abe highlights relationships and opportunities that deserve additional attention."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Outreach?",
        "answer": [
          "The value of every campaign interaction is created through thoughtful follow-up. Outreach ensures those opportunities don't disappear, helping campaigns build stronger relationships through consistent communication and purposeful execution."
        ]
      }
    ]
  },
  {
    "id": "digital",
    "eyebrow": "Departments",
    "title": "Digital",
    "description": "Practical guidance from the Aether Political Academy on digital.",
    "tone": "slate",
    "items": [
      {
        "question": "What should I know about Digital?",
        "answer": [
          "Modern campaigns are no longer fought only on front porches and at fundraising events.",
          "Every day, campaigns compete for attention across social media, websites, digital advertising, email, text messaging, and online communities.",
          "Every post. Every advertisement. Every video. Every email. Every message contributes to the story a campaign tells."
        ]
      },
      {
        "question": "How does every Platform Tells Part of the Story work in Digital?",
        "answer": [
          "Campaigns rarely communicate through a single channel. Supporters may discover the campaign through Facebook, watch a speech on YouTube, visit the campaign website, respond to an email, see a digital advertisement, or read a social media post.",
          "No single platform tells the entire story.",
          "Rather than replacing those platforms, Aether helps campaigns understand how they work together. By bringing analytics from supported integrations into one Campaign Operating System, Digital directors gain a clearer picture of how their online efforts contribute to the campaign's overall strategy."
        ]
      },
      {
        "question": "How does organized Around Execution work in Digital?",
        "answer": [
          "Great digital campaigns aren't built one post at a time. They're built through planning, coordination, and consistent execution.",
          "The Digital department gives campaign teams a centralized place to organize upcoming work, manage content schedules, assign responsibilities, and track deliverables from creation through completion.",
          "Whether preparing graphics for an endorsement, coordinating a fundraising campaign, planning Election Day messaging, or organizing content around an upcoming event, Digital teams can manage their workload alongside every other department in the campaign."
        ]
      },
      {
        "question": "How does helping Campaigns Stay Engaged work in Digital?",
        "answer": [
          "Publishing content is only one part of digital communication. Responding to supporters is just as important.",
          "Aether doesn't publish social media posts, and it doesn't respond to comments on a campaign's behalf. Instead, supported integrations can identify new audience interactions and provide response templates for common situations.",
          "Every response remains under the campaign's control. Nothing is posted automatically. Campaign staff can personalize a suggested response, copy it into the appropriate platform, and continue engaging with their community.",
          "The result isn't automated communication. It's faster, more consistent communication."
        ]
      },
      {
        "question": "How does intelligence Beyond Individual Platforms work in Digital?",
        "answer": [
          "Every digital platform provides analytics: likes, views, comments, reach, engagement, website traffic, and advertising performance.",
          "The challenge isn't finding data. It's understanding what that data means for the campaign.",
          "Rather than asking campaign staff to jump between multiple dashboards, Aether brings those insights together into one operational view. Campaign leadership can better understand how digital efforts contribute to fundraising, volunteer engagement, voter outreach, and overall campaign performance, while Honest Abe helps identify meaningful trends and emerging opportunities."
        ]
      },
      {
        "question": "How does connected to the Entire Campaign work in Digital?",
        "answer": [
          "Digital doesn't exist in isolation. A successful fundraising appeal may generate increased online engagement. A field event may drive website traffic. An endorsement may increase volunteer interest. An important announcement may influence fundraising, field operations, and outreach simultaneously.",
          "Because the Digital department operates alongside Finance, Field, Outreach, Print, and campaign leadership, those connections become visible.",
          "Instead of asking:",
          "“How did this post perform?”",
          "Campaigns can begin asking:"
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Digital?",
        "answer": [
          "Digital campaigns generate an extraordinary amount of information. The challenge has never been collecting data. The challenge has always been turning that information into meaningful action.",
          "Aether helps campaigns organize their digital work, understand their performance, and engage more consistently with the communities they serve.",
          "It doesn't replace the platforms campaigns already rely on. It brings them together into one operational picture, helping campaign teams communicate with greater purpose and execute with greater confidence.",
          "Because successful digital strategy isn't measured by likes or impressions alone. It's measured by the real-world impact those efforts have on the campaign."
        ]
      }
    ]
  },
  {
    "id": "print",
    "eyebrow": "Departments",
    "title": "Print",
    "description": "Practical guidance from the Aether Political Academy on print.",
    "tone": "navy",
    "items": [
      {
        "question": "What should I know about Print?",
        "answer": [
          "Campaigns don't exist only online. They exist in neighborhoods, at community events, on front lawns, in mailboxes, and in the hands of volunteers. The Print department helps ensure campaigns always have the materials they need to execute."
        ]
      },
      {
        "question": "How does equipping the Campaign work in Print?",
        "answer": [
          "Walk literature, palm cards, direct mail, yard signs, volunteer apparel, banners, event signage, and campaign resources are organized from planning through distribution so they're available before they're needed."
        ]
      },
      {
        "question": "How does organized Around Execution work in Print?",
        "answer": [
          "Every print project moves through planning, design, review, approval, production, delivery, and distribution. Focus Mode keeps every step visible and moving toward completion."
        ]
      },
      {
        "question": "How does inventory That Works for You work in Print?",
        "answer": [
          "Aether tracks inventory across campaign materials and alerts leadership before shortages become operational problems, making reorders proactive instead of reactive."
        ]
      },
      {
        "question": "How does planning Beyond Today work in Print?",
        "answer": [
          "Production timelines, expected deliveries, and inventory forecasts help campaign leadership identify risks early and coordinate upcoming events with confidence."
        ]
      },
      {
        "question": "How does connected to the Entire Campaign work in Print?",
        "answer": [
          "Print works alongside Finance, Field, Outreach, Digital, and Leadership. Requests, approvals, inventory, and project progress become part of one shared operational picture instead of isolated production work."
        ]
      },
      {
        "question": "How does intelligence That Keeps Campaigns Ready work in Print?",
        "answer": [
          "The Print Dashboard and Honest Abe monitor inventory, production timelines, delivery schedules, and resource readiness so campaigns can prepare for what's coming next rather than simply reacting."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Print?",
        "answer": [
          "Every printed piece is an opportunity to strengthen the campaign. The Print department ensures campaign materials are organized, available, and delivered when they're needed most—because successful campaigns are equipped through planning, coordination, and consistent execution."
        ]
      }
    ]
  },
  {
    "id": "contacts",
    "eyebrow": "Political Academy",
    "title": "Contacts",
    "description": "Practical guidance from the Aether Political Academy on contacts.",
    "tone": "purple",
    "items": [
      {
        "question": "What should I know about Contacts?",
        "answer": [
          "Every campaign is built around people. Voters, donors, volunteers, supporters, community leaders, event attendees, campaign staff—every conversation, contribution, volunteer shift, and relationship begins with a person. The Contacts section serves as the foundation of Aether, bringing those relationships together into one shared operational view that every department can build upon."
        ]
      },
      {
        "question": "How does one Campaign. One Contact Database. work in Contacts?",
        "answer": [
          "Every department works from the same contact database. Finance, Field, Digital, Outreach, and Leadership all contribute to a single campaign record, creating one shared understanding of every person connected to the campaign."
        ]
      },
      {
        "question": "How does building Smarter Contact Records work in Contacts?",
        "answer": [
          "With supported integrations, Aether enriches contact records by associating publicly available FEC contribution history directly with contact profiles, giving campaign teams immediate context without manual research."
        ]
      },
      {
        "question": "How does a Living Campaign Record work in Contacts?",
        "answer": [
          "Donations, pledges, canvassing conversations, running notes, volunteer activity, list assignments, and campaign history remain connected to a single record, allowing every interaction to strengthen the campaign's understanding of that relationship."
        ]
      },
      {
        "question": "How does organizing Campaign Work work in Contacts?",
        "answer": [
          "Lists transform contacts into actionable work for fundraising, volunteer recruitment, canvassing, outreach, events, follow-up, and countless other campaign objectives, allowing every department to execute from the same foundation."
        ]
      },
      {
        "question": "How does protecting Data Quality work in Contacts?",
        "answer": [
          "Every contact is validated using the phone number as its unique identifier. Duplicate records are prevented before they're created, helping maintain one complete history for every individual."
        ]
      },
      {
        "question": "How does finding Information Quickly work in Contacts?",
        "answer": [
          "Powerful search allows campaign staff to locate contacts by name, phone number, address, and other identifying information, ensuring every department can quickly access the information relevant to their work."
        ]
      },
      {
        "question": "How does built for Collaboration work in Contacts?",
        "answer": [
          "Because contacts belong to the campaign—not individual departments—every team contributes to a richer understanding of each relationship, improving collaboration and reducing duplicate work across the organization."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Contacts?",
        "answer": [
          "Every campaign begins with people. The Contacts section keeps those relationships connected throughout every stage of the campaign, providing one shared operational foundation that supports every department—because campaigns aren't built around software. They're built around people."
        ]
      }
    ]
  },
  {
    "id": "lists",
    "eyebrow": "Political Academy",
    "title": "Lists",
    "description": "Practical guidance from the Aether Political Academy on lists.",
    "tone": "green",
    "items": [
      {
        "question": "What should I know about Lists?",
        "answer": [
          "Every campaign begins with a goal. Raise money. Knock doors. Recruit volunteers. Invite supporters to an event. Follow up with undecided voters. Prepare for Election Day. Those goals become reality through organized work. The Lists section transforms campaign priorities into actionable objectives, giving every department a clear starting point while keeping the entire campaign aligned around shared goals."
        ]
      },
      {
        "question": "How does more Than a Collection of Contacts work in Lists?",
        "answer": [
          "A list isn't simply a group of names. It's a campaign objective. Fundraising, canvassing, volunteer recruitment, event invitations, direct mail, and follow-up campaigns all begin as organized lists that become actionable work throughout the Campaign Operating System."
        ]
      },
      {
        "question": "How does one Campaign. Shared Objectives. work in Lists?",
        "answer": [
          "Because every department works from the same contact database, lists become shared campaign assets rather than isolated departmental projects. Each interaction strengthens the campaign's shared understanding of every relationship."
        ]
      },
      {
        "question": "How does built for Execution work in Lists?",
        "answer": [
          "Once work begins, Focus Mode guides staff through contacts one at a time, ensuring every completed conversation, pledge, canvassing result, or outreach effort immediately strengthens the campaign's shared knowledge."
        ]
      },
      {
        "question": "How does designed to Adapt work in Lists?",
        "answer": [
          "Campaign priorities change as Election Day approaches. Teams can create new lists, refine existing ones, and reorganize priorities as circumstances evolve without losing momentum."
        ]
      },
      {
        "question": "How does getting Started Faster work in Lists?",
        "answer": [
          "When contacts are imported, Honest Abe can recommend which department a list best supports, helping reduce setup time while leaving every decision in the hands of campaign staff."
        ]
      },
      {
        "question": "How does smarter Prioritization work in Lists?",
        "answer": [
          "Honest Abe highlights contacts that may deserve additional attention based on campaign activity, fundraising history, engagement, and operational signals, helping teams focus their efforts where they may have the greatest impact."
        ]
      },
      {
        "question": "How does building Institutional Knowledge work in Lists?",
        "answer": [
          "Every completed list leaves the campaign stronger. Contacts become more complete, relationships become clearer, campaign history grows richer, and future lists become more informed."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Lists?",
        "answer": [
          "The Lists section connects strategy with execution, ensuring campaign priorities become organized, measurable, and actionable. Campaigns don't move forward one contact at a time—they move forward one organized objective at a time."
        ]
      }
    ]
  },
  {
    "id": "imports",
    "eyebrow": "Political Academy",
    "title": "Imports",
    "description": "Practical guidance from the Aether Political Academy on imports.",
    "tone": "amber",
    "items": [
      {
        "question": "What should I know about Imports?",
        "answer": [
          "Every campaign already has data. Whether it's voter contacts, donor records, volunteer information, or campaign analytics, getting that information into Aether should be simple. The Imports section allows campaigns to quickly bring existing data into the Campaign Operating System, reducing manual work and helping teams begin executing sooner."
        ]
      },
      {
        "question": "How does contact Imports work in Imports?",
        "answer": [
          "Upload contact information from a CSV file and migrate existing campaign data into Aether. During the import process, Aether analyzes your data and can recommend which department a list is best suited for before it's imported, helping organize your campaign from the very beginning."
        ]
      },
      {
        "question": "How does analytics Imports work in Imports?",
        "answer": [
          "Campaigns that prefer manual reporting can upload CSV exports from supported platforms, allowing Digital and Print analytics to be imported directly into Aether while keeping reporting current."
        ]
      },
      {
        "question": "How does built for Flexibility work in Imports?",
        "answer": [
          "Some campaigns prefer live integrations while others upload information on their own schedule. Aether supports both approaches, allowing every organization to choose the workflow that best fits its operation."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Imports?",
        "answer": [
          "Data only becomes valuable when it's organized and actionable. The Imports section transforms existing campaign information into meaningful work, bringing contacts and analytics into Aether so teams can spend less time preparing data and more time executing the campaign."
        ]
      }
    ]
  },
  {
    "id": "tools",
    "eyebrow": "Political Academy",
    "title": "Tools",
    "description": "Practical guidance from the Aether Political Academy on tools.",
    "tone": "rose",
    "items": [
      {
        "question": "What should I know about Tools?",
        "answer": [
          "Campaigns communicate constantly. Meetings are scheduled. Documents are shared. Emails are sent. Questions are answered. The Tools section brings those everyday activities together, allowing campaign teams to coordinate from within Aether instead of constantly switching between multiple applications."
        ]
      },
      {
        "question": "How does built Around Everyday Campaign Work work in Tools?",
        "answer": [
          "Successful campaigns depend on communication. Whether you're reviewing strategy documents, coordinating meetings, sending emails, or discussing the next event, the Tools section provides a central place for teams to stay connected throughout the campaign.",
          "By bringing these workflows together, Aether helps reduce context switching and keeps campaign operations moving forward."
        ]
      },
      {
        "question": "How does google Workspace Integration work in Tools?",
        "answer": [
          "Aether is built around Google Workspace. Campaigns can connect a shared Google Workspace account to access Gmail, Google Calendar, and Google Drive directly within Aether.",
          "We recommend using a dedicated campaign email such as info@yourcampaign.com or team@yourcampaign.com so authorized team members share the same inbox, documents, and calendar as a single source of truth.",
          "Emails sent through Aether remain visible within Aether, allowing authorized staff to review conversations, maintain continuity, and keep communication organized.",
          "We intentionally focused on Google Workspace because it's affordable, widely adopted by campaigns, and provides a reliable foundation for campaign operations."
        ]
      },
      {
        "question": "How does aether Group Chat work in Tools?",
        "answer": [
          "Not every conversation belongs in an email. Aether Group Chat gives campaign teams a dedicated space to coordinate work, ask questions, share updates, and collaborate without leaving the Campaign Operating System."
        ]
      },
      {
        "question": "How does full Data Export work in Tools?",
        "answer": [
          "Your campaign data is your campaign data. Campaign leadership can use the Full Data Export option in Tools to download a copy of campaign-owned operational data from Aether.",
          "We recommend keeping an up-to-date export as part of your campaign's normal data practices and completing a final export before your post-subscription retention period expires."
        ]
      },
      {
        "question": "How does built to Grow work in Tools?",
        "answer": [
          "The Tools section will continue evolving alongside Aether. As campaigns identify new opportunities to improve communication and collaboration, additional capabilities may be introduced to further simplify day-to-day campaign operations.",
          "Our goal isn't to integrate every productivity platform on the market. It's to provide the tools campaigns use every day in a way that's simple, reliable, and keeps teams working together."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Tools?",
        "answer": [
          "Campaigns move quickly. The fewer applications your team has to jump between, the more time they can spend executing the work that matters. The Tools section brings communication, collaboration, and coordination together—helping your campaign stay connected while remaining focused on execution."
        ]
      }
    ]
  },
  {
    "id": "integrations-hub",
    "eyebrow": "Political Academy",
    "title": "Integrations Hub",
    "description": "Practical guidance from the Aether Political Academy on integrations hub.",
    "tone": "slate",
    "items": [
      {
        "question": "What should I know about Integrations Hub?",
        "answer": [
          "Connecting your campaign's tools should be simple. The Integrations Hub provides a centralized location where Organization Administrators, Campaign Managers, and Department Directors can connect, manage, and monitor the external services that power your campaign."
        ]
      },
      {
        "question": "How does a Centralized Management Hub work in Integrations Hub?",
        "answer": [
          "Rather than configuring integrations throughout multiple areas of the platform, Aether brings them together in one streamlined interface.",
          "• Connect new services",
          "• Review existing connections",
          "• Reauthorize expired connections",
          "• Monitor integration status"
        ]
      },
      {
        "question": "How does director-Level Access work in Integrations Hub?",
        "answer": [
          "Because integrations affect the entire campaign, access to the Integrations Hub is limited to Organization Administrators, Campaign Managers, and Department Directors.",
          "This ensures campaign-wide services are managed by trusted leadership while allowing General Users to remain focused on day-to-day execution.",
          "The Integrations Hub can be accessed directly from the Tools section of Aether."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Integrations Hub?",
        "answer": [
          "The easier it is to manage your campaign's connected services, the easier it is to keep your team moving.",
          "The Integrations Hub provides a single place to configure and maintain the external tools your campaign depends on—keeping setup simple, organized, and ready for execution."
        ]
      }
    ]
  },
  {
    "id": "integrations",
    "eyebrow": "Political Academy",
    "title": "Integrations",
    "description": "Practical guidance from the Aether Political Academy on integrations.",
    "tone": "navy",
    "items": [
      {
        "question": "What should I know about Integrations?",
        "answer": [
          "No campaign operates with a single piece of software. Fundraising platforms. Social media. Calendars. Email. Cloud storage. Analytics. Modern campaigns rely on dozens of tools to accomplish their goals.",
          "Aether connects the services campaigns already rely on so campaign teams can work from one operational picture instead of constantly switching between disconnected platforms."
        ]
      },
      {
        "question": "How does live Integrations work in Integrations?",
        "answer": [
          "The following integrations are live and currently supported within Aether:",
          "Integration availability can depend on third-party platform access, API permissions, provider requirements, and the capabilities made available by each connected service."
        ]
      },
      {
        "question": "How does google Routes in the Field work in Integrations?",
        "answer": [
          "Google Routes is live within Aether and Aether Mobile, supporting field execution alongside shared contact data, lists, dispositions, and running notes. This keeps route planning and field activity connected to the same operational picture used by the rest of the campaign."
        ]
      },
      {
        "question": "How does cSV Imports and Manual Workflows work in Integrations?",
        "answer": [
          "Live integrations are not the only way to bring campaign information into Aether. CSV import functionality is available today for campaigns that prefer manual workflows or need to bring data in from systems without a direct connection.",
          "This gives campaigns flexibility to use live connections where available while continuing to import structured campaign data on their own schedule when that workflow makes more sense."
        ]
      },
      {
        "question": "How Connected Services Access Data?",
        "answer": [
          "When campaign leadership connects a supported third-party service, Aether accesses only the information and capabilities authorized through that provider connection and uses that access to provide the integration features requested by the campaign.",
          "Each connected service remains subject to the permissions, security practices, and policies of its provider. Campaign leadership controls which supported integrations are connected to the organization.",
          "Disconnecting a supported service stops future connection activity where supported, but does not necessarily remove information that was previously imported into Aether as part of the campaign’s operational data."
        ]
      },
      {
        "question": "How does built with Purpose work in Integrations?",
        "answer": [
          "Not every outside service belongs inside a Campaign Operating System. Aether prioritizes integrations that help campaigns reduce duplicate work, improve visibility, enrich campaign data, or strengthen operational awareness while allowing campaigns to continue using the tools they already trust."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Integrations?",
        "answer": [
          "The best campaign software doesn't exist in isolation. It works alongside the tools campaigns already depend on. Connect what matters. Reduce unnecessary work. Keep information flowing. Help every department operate from the same shared understanding of the campaign.",
          "Great integrations are not measured by how many logos appear on a page. They are measured by how effectively they help campaigns execute."
        ]
      }
    ]
  },
  {
    "id": "public-campaign-portal",
    "eyebrow": "Political Academy",
    "title": "Public Campaign Portal",
    "description": "Practical guidance from the Aether Political Academy on public campaign portal.",
    "tone": "purple",
    "items": [
      {
        "question": "What should I know about Public Campaign Portal?",
        "answer": [
          "Campaigns generate meaningful activity every day. The Public Campaign Portal gives campaigns a simple way to share selected parts of that activity with voters, supporters, volunteers, donors, and the broader community without exposing the campaign's internal workspace."
        ]
      },
      {
        "question": "How does your Campaign Controls What Becomes Public work in Public Campaign Portal?",
        "answer": [
          "Organization Administrators can enable or disable the Public Campaign Portal from Admin settings and choose which campaign metrics are visible. Metrics that are not enabled remain absent from the public portal.",
          "This allows each campaign to decide what it wants to share while keeping internal campaign information private."
        ]
      },
      {
        "question": "How does available Public Metrics work in Public Campaign Portal?",
        "answer": [
          "Campaigns can individually choose to display:",
          "• Doors Knocked — completed work from Field lists.",
          "• Digital Impressions — impressions recorded through Digital analytics.",
          "• Total Raised — recorded campaign contributions.",
          "• Campaign Materials Available — current inventory recorded through Print."
        ]
      },
      {
        "question": "How does built Into the Campaign Directory work in Public Campaign Portal?",
        "answer": [
          "When the Public Campaign Portal is enabled, the campaign can appear in Aether's public Campaign Directory. Visitors can browse participating campaigns by state, office, and candidate, then open the campaign's public profile to view the information that campaign has chosen to share.",
          "Campaigns can also share a direct link to their own public portal, making it easy to connect voters and supporters directly to their campaign's page."
        ]
      },
      {
        "question": "How does connect Visitors to the Campaign work in Public Campaign Portal?",
        "answer": [
          "Administrators can optionally add the campaign's official website and donation page to the portal. These links give visitors a direct path to learn more about the campaign or support it using the campaign's existing public resources."
        ]
      },
      {
        "question": "How does designed for Transparency Without Oversharing work in Public Campaign Portal?",
        "answer": [
          "The Public Campaign Portal is intentionally separate from Aether's internal campaign workspace. It presents only the information a campaign has chosen to make public and does not provide visitors access to contacts, lists, notes, internal strategy, team activity, or administrative tools."
        ]
      },
      {
        "question": "How does one Campaign. Two Audiences. work in Public Campaign Portal?",
        "answer": [
          "Inside Aether, campaign teams use operational data to organize and execute their work. Through the Public Campaign Portal, campaigns can selectively turn some of that activity into a public-facing view for the people they serve.",
          "The campaign remains in control of what is shared, while voters and supporters gain a simple place to learn about participating campaigns and see selected campaign activity."
        ]
      }
    ]
  },
  {
    "id": "organizations",
    "eyebrow": "Political Academy",
    "title": "Organizations",
    "description": "Practical guidance from the Aether Political Academy on organizations.",
    "tone": "green",
    "items": [
      {
        "question": "What should I know about Organizations?",
        "answer": [
          "Every campaign is different. Different priorities. Different strategies. Different teams. Different political parties. Aether was built to support campaigns across the political spectrum, providing the same Campaign Operating System regardless of party affiliation.",
          "Our goal is simple. Build great campaign software. Let campaigns decide how to use it."
        ]
      },
      {
        "question": "How does designed for Every Campaign work in Organizations?",
        "answer": [
          "When creating an organization, campaigns can identify themselves as Democratic, Republican, or choose Aether's default organization type. That selection helps personalize the experience without changing how the platform operates.",
          "Every organization receives the same core features, the same tools, and the same commitment to helping campaigns execute more effectively."
        ]
      },
      {
        "question": "How does built Around Your Organization work in Organizations?",
        "answer": [
          "Certain parts of Aether automatically adapt based on your organization's configuration. Integration recommendations are context-aware, ensuring Democratic campaigns aren't presented with Republican fundraising platforms, and Republican campaigns aren't presented with Democratic ones.",
          "The interface also adjusts to reflect your organization, using blue for Democratic organizations, red for Republican organizations, or Aether's default navy theme. As Aether continues to grow, we look forward to expanding personalization options with additional themes and organization preferences."
        ]
      },
      {
        "question": "How does one Platform. Equal Support. work in Organizations?",
        "answer": [
          "Aether doesn't believe great campaign technology should belong to one party. Our mission is to build the best Campaign Operating System possible and make it available to every campaign that's working to engage voters, organize supporters, and serve their communities.",
          "Politics may differ. Good operations don't."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Organizations?",
        "answer": [
          "Every campaign deserves tools that help it succeed. Regardless of party affiliation, Aether provides the same operational foundation, allowing organizations to focus less on managing software and more on running their campaigns.",
          "Because better organization benefits every campaign."
        ]
      }
    ]
  },
  {
    "id": "team-management",
    "eyebrow": "Political Academy",
    "title": "Team Management",
    "description": "Practical guidance from the Aether Political Academy on team management.",
    "tone": "amber",
    "items": [
      {
        "question": "What should I know about Team Management?",
        "answer": [
          "Campaigns are built by people working together.",
          "From volunteers and department directors to campaign leadership, every team member plays a different role in helping the campaign succeed.",
          "The Team Management section gives Organization Administrators a simple way to build and manage that team while ensuring every user has access to the tools they need."
        ]
      },
      {
        "question": "How does built for Organization Administrators work in Team Management?",
        "answer": [
          "Managing a campaign team shouldn't require technical expertise.",
          "Organization Administrators can quickly add new members, remove users when necessary, and manage access from a single location.",
          "As campaigns grow and responsibilities change, Team Management makes it easy to keep the organization's structure up to date without disrupting day-to-day operations."
        ]
      },
      {
        "question": "How does flexible Roles and Departments work in Team Management?",
        "answer": [
          "Campaigns aren't always organized the same way.",
          "Some staff wear multiple hats.",
          "A Finance Director may also oversee Outreach.",
          "A Field Director may assist with Digital.",
          "Campaign leadership often spans several departments at once."
        ]
      },
      {
        "question": "How does built to Grow with Your Campaign work in Team Management?",
        "answer": [
          "Campaign teams change throughout the election cycle.",
          "New volunteers become staff.",
          "Consultants join for specific projects.",
          "Departments expand as Election Day approaches.",
          "Team Management makes those transitions simple, allowing Organization Administrators to adapt the organization as the campaign evolves."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Team Management?",
        "answer": [
          "Strong campaigns depend on strong teams.",
          "Team Management provides Organization Administrators with the tools to organize staff, manage access, and support collaboration across every department.",
          "Because when every person has the right access to the right tools, the entire campaign operates more effectively."
        ]
      }
    ]
  },
  {
    "id": "roles",
    "eyebrow": "Political Academy",
    "title": "Roles & Permissions",
    "description": "Practical guidance from the Aether Political Academy on roles & permissions.",
    "tone": "rose",
    "items": [
      {
        "question": "What should I know about Roles & Permissions?",
        "answer": [
          "Every member of a campaign contributes differently.",
          "A Campaign Manager doesn't perform the same work as a Finance Director.",
          "A Finance Director doesn't perform the same work as a volunteer making donor calls."
        ]
      },
      {
        "question": "How does built Around Responsibility work in Roles & Permissions?",
        "answer": [
          "Roles and permissions aren't designed to restrict users.",
          "They're designed to reduce unnecessary complexity.",
          "By tailoring each user's experience to their responsibilities, Aether creates a cleaner workspace, minimizes distractions, and helps every department operate more efficiently.",
          "As responsibilities change throughout a campaign, Organization Administrators can update roles and permissions at any time."
        ]
      },
      {
        "question": "How does administrative Access work in Roles & Permissions?",
        "answer": [
          "Organization Administrators and Campaign Managers have full visibility across the Campaign Operating System.",
          "They can view every department, monitor campaign activity, manage users, and oversee campaign operations from a complete organizational perspective.",
          "This level of access helps leadership understand how every department is performing while ensuring they can support the campaign wherever needed."
        ]
      },
      {
        "question": "How does department Leadership work in Roles & Permissions?",
        "answer": [
          "Department Directors have full access within the departments they lead.",
          "In addition to managing their department's work, Directors also have access to the campaign's Overview Dashboard, allowing them to understand how their department contributes to the campaign's broader objectives.",
          "This balance provides department leaders with the visibility they need while keeping their daily focus on the teams they manage."
        ]
      },
      {
        "question": "How does general Users work in Roles & Permissions?",
        "answer": [
          "General Users receive a streamlined experience centered around their assigned department.",
          "Rather than exposing every tool and administrative function, Aether presents the features, workflows, and information most relevant to their day-to-day responsibilities.",
          "General Users also have access to the Overview Dashboard, providing high-level visibility into campaign progress while keeping their primary focus on executing the work assigned to them."
        ]
      },
      {
        "question": "How does focus Through Simplicity work in Roles & Permissions?",
        "answer": [
          "The goal of roles and permissions isn't simply controlling access.",
          "It's helping every member of the campaign stay in their operating lane.",
          "When every user sees the right information, has the right tools, and focuses on the responsibilities assigned to them, the entire campaign becomes more organized, more efficient, and easier to manage."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Roles & Permissions?",
        "answer": [
          "The best campaigns aren't built by giving everyone access to everything.",
          "They're built by giving every team member exactly what they need to succeed.",
          "Roles and permissions ensure every user can contribute effectively while leadership maintains the visibility needed to guide the campaign forward."
        ]
      }
    ]
  },
  {
    "id": "security",
    "eyebrow": "Political Academy",
    "title": "Security",
    "description": "Practical guidance from the Aether Political Academy on security.",
    "tone": "slate",
    "items": [
      {
        "question": "What should I know about Security?",
        "answer": [
          "Campaigns trust Aether with information that’s essential to their daily operations.",
          "Campaign strategy.",
          "That trust isn’t something we take lightly."
        ]
      },
      {
        "question": "How does protecting Your Campaign work in Security?",
        "answer": [
          "Every campaign deserves confidence that its information is being handled responsibly.",
          "From encrypted connections and protected data storage to organization-level access controls, Aether is designed to help protect campaign information while ensuring authorized team members can access the information they need to do their jobs. Campaign data remains isolated within its own organization, and Organization Administrators control who can join the campaign, what roles they hold, and what information they can access. Data is encrypted both in transit and at rest, helping protect information throughout its lifecycle.",
          "As the platform continues to evolve, so will our security practices.",
          "Protecting campaign data will always remain one of our highest priorities."
        ]
      },
      {
        "question": "How does security Through Organization work in Security?",
        "answer": [
          "Good security isn’t only about technology.",
          "It’s also about making sure the right people have access to the right information.",
          "Aether’s role and permission system helps campaigns organize access based on responsibility, allowing team members to focus on their work while reducing unnecessary exposure to information outside their role.",
          "Strong organization is an important part of strong security."
        ]
      },
      {
        "question": "How does your Data Remains Yours work in Security?",
        "answer": [
          "Aether exists to help campaigns organize, understand, and execute—not to claim ownership of the information entrusted to the platform. Campaign leadership can use Full Data Export in Tools to retain a copy of campaign-owned operational data.",
          "Following cancellation or completion of yearly usage, Aether may retain campaign data for up to 60 days. Campaigns should export their full data set before that grace period expires.",
          "Campaigns that want to preserve their Aether data between campaign cycles may keep their data stored in Aether for $5 per month until the next campaign rather than allowing the post-subscription retention period to expire."
        ]
      },
      {
        "question": "How does a Commitment to Trust work in Security?",
        "answer": [
          "Technology changes.",
          "Security threats evolve.",
          "Campaigns deserve software that evolves alongside them.",
          "We’ll continue investing in the security of the platform, improving protections, and adopting best practices as Aether grows.",
          "Because earning a campaign’s trust doesn’t happen once."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Security?",
        "answer": [
          "Campaigns have enough to worry about.",
          "Your software shouldn’t be one of them.",
          "Our commitment is simple:",
          "Protect your information.",
          "Respect your trust."
        ]
      },
      {
        "question": "How does security Philosophy work in Security?",
        "answer": [
          "Campaign data should only be accessible to authorized users. Aether uses authenticated access, role-based permissions, encrypted communications, protected stored data, organization isolation, audit history, and ongoing platform maintenance to help safeguard campaign information."
        ]
      },
      {
        "question": "How does responsible Disclosure work in Security?",
        "answer": [
          "If you believe you have identified a security issue, Team Aether encourages responsible disclosure so the issue can be investigated and addressed appropriately."
        ]
      }
    ]
  },
  {
    "id": "privacy",
    "eyebrow": "Political Academy",
    "title": "Privacy",
    "description": "Practical guidance from the Aether Political Academy on privacy.",
    "tone": "navy",
    "items": [
      {
        "question": "What should I know about Privacy?",
        "answer": [
          "Campaigns trust Aether with information that matters.",
          "That information belongs to your organization—not to us.",
          "Our role is to provide the tools that help campaigns organize, execute, and succeed while respecting the privacy of the information entrusted to the platform."
        ]
      },
      {
        "question": "How does your Data Stays Yours work in Privacy?",
        "answer": [
          "Aether exists to help campaigns manage their operations.",
          "We don’t build the platform to own your campaign data or use it for purposes outside of supporting your organization’s experience within Aether.",
          "Your campaign’s contacts, operational data, and organizational information remain your campaign’s information.",
          "Aether does not sell campaign data or treat campaign contacts, donor information, supporter information, volunteer records, or operational data as an advertising product."
        ]
      },
      {
        "question": "How does built on Respect work in Privacy?",
        "answer": [
          "Privacy is about more than policies.",
          "It’s about treating campaign information with the same level of respect we’d expect for our own.",
          "Every feature we build considers how information is accessed, who should be able to see it, and how organizations maintain control over their own data."
        ]
      },
      {
        "question": "How does transparency Matters work in Privacy?",
        "answer": [
          "We believe campaigns should understand how their information is handled.",
          "Our Privacy Policy provides the complete legal details regarding data collection, storage, and platform usage, and we’ll continue updating those policies as Aether evolves.",
          "Our goal is to be transparent—not confusing."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in Privacy?",
        "answer": [
          "Campaigns choose Aether to help manage their operations.",
          "That relationship is built on trust.",
          "We’re committed to respecting your organization’s privacy, protecting your information, and being transparent about how the platform works.",
          "Because your campaign should always remain in control of its own data."
        ]
      }
    ]
  },
  {
    "id": "faq",
    "eyebrow": "Political Academy",
    "title": "FAQ & Support",
    "description": "Practical guidance from the Aether Political Academy on faq & support.",
    "tone": "purple",
    "items": [
      {
        "question": "What should I know about FAQ & Support?",
        "answer": [
          "Questions are a natural part of learning any new platform.",
          "The Frequently Asked Questions section provides quick answers to common questions about using Aether, helping users find information without interrupting their workflow.",
          "As Aether continues to grow, the FAQ will continue growing alongside it."
        ]
      },
      {
        "question": "How does always Evolving work in FAQ & Support?",
        "answer": [
          "No software remains exactly the same.",
          "New features are introduced.",
          "Existing workflows improve.",
          "Questions change over time.",
          "Because of that, our FAQ is continuously updated to reflect the current version of Aether, ensuring answers remain accurate as the platform evolves."
        ]
      },
      {
        "question": "How does when You Need More Than an Answer work in FAQ & Support?",
        "answer": [
          "Sometimes a simple answer isn’t enough.",
          "Some topics deserve additional explanation, real-world examples, or a deeper understanding of why Aether works the way it does.",
          "That’s exactly why we created the Aether Academy.",
          "While the FAQ provides quick answers, the Academy provides the context behind those answers—explaining not only how to use Aether, but also the campaign operations and philosophies that shaped it.",
          "Together, they help campaigns move from simply using the platform to fully understanding it."
        ]
      },
      {
        "question": "How does clarity. Focus. Execution. work in FAQ & Support?",
        "answer": [
          "Questions will always exist.",
          "Our goal isn’t simply to answer them.",
          "Our goal is to give campaigns the knowledge and confidence to use Aether effectively, today and as it continues to evolve.",
          "Because great software isn’t just easy to use.",
          "It’s easy to understand."
        ]
      }
    ]
  }
];

function getToneClasses(tone: FAQSection["tone"]) {
  switch (tone) {
    case "purple":
      return {
        chip: "bg-purple-50 text-purple-700 border-purple-200",
        card: "border-purple-100 bg-purple-50/40",
        accent: "from-purple-500 to-indigo-500",
      };
    case "green":
      return {
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        card: "border-emerald-100 bg-emerald-50/40",
        accent: "from-emerald-500 to-teal-500",
      };
    case "amber":
      return {
        chip: "bg-amber-50 text-amber-700 border-amber-200",
        card: "border-amber-100 bg-amber-50/40",
        accent: "from-amber-500 to-orange-500",
      };
    case "rose":
      return {
        chip: "bg-rose-50 text-rose-700 border-rose-200",
        card: "border-rose-100 bg-rose-50/40",
        accent: "from-rose-500 to-red-500",
      };
    case "slate":
      return {
        chip: "bg-slate-50 text-slate-700 border-slate-200",
        card: "border-slate-200 bg-slate-50/70",
        accent: "from-slate-500 to-slate-700",
      };
    case "navy":
    default:
      return {
        chip: "bg-blue-50 text-blue-800 border-blue-200",
        card: "border-blue-100 bg-blue-50/40",
        accent: "from-blue-700 to-slate-900",
      };
  }
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function FAQPage() {
  const [query, setQuery] = useState("");
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
  const normalizedQuery = normalizeSearch(query);

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return faqSections;

    return faqSections
      .map((section) => {
        const sectionMatch =
          section.title.toLowerCase().includes(normalizedQuery) ||
          section.eyebrow.toLowerCase().includes(normalizedQuery) ||
          section.description.toLowerCase().includes(normalizedQuery);

        const items = section.items.filter((item) => {
          return (
            sectionMatch ||
            item.question.toLowerCase().includes(normalizedQuery) ||
            item.answer.some((line) =>
              line.toLowerCase().includes(normalizedQuery)
            )
          );
        });

        return {
          ...section,
          items,
        };
      })
      .filter((section) => section.items.length > 0);
  }, [normalizedQuery]);

  const totalQuestions = faqSections.reduce(
    (sum, section) => sum + section.items.length,
    0
  );

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
              Aether Political FAQ
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-4xl">
              Aether Political — Frequently Asked Questions
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg lg:mt-4 lg:text-sm lg:leading-6">
              Practical answers for campaign teams, grounded in the Political Academy and organized by department, workflow, and feature.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 lg:mt-6 lg:gap-3">
              <a
                href="/aether-academy/political-academy"
                className="inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/10 px-6 py-3 font-semibold text-violet-300 transition hover:-translate-y-0.5 hover:border-violet-300 lg:px-4 lg:py-2 lg:text-sm"
              >
                Explore Political Academy →
              </a>

              <a
                href="/support"
                className="inline-flex items-center justify-center rounded-xl border border-blue-400/40 bg-blue-400/10 px-6 py-3 font-semibold text-blue-300 transition hover:-translate-y-0.5 hover:border-blue-300 lg:px-4 lg:py-2 lg:text-sm"
              >
                Support →
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:grid-cols-3 lg:min-w-[315px] lg:gap-2 lg:rounded-2xl lg:p-3">
            <div className="rounded-2xl bg-white/10 p-4 lg:rounded-xl lg:p-3">
              <div className="text-3xl font-black lg:text-2xl">{faqSections.length}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 lg:text-[9px]">
                Sections
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 lg:rounded-xl lg:p-3">
              <div className="text-3xl font-black lg:text-2xl">{totalQuestions}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 lg:text-[9px]">
                Questions
              </div>
            </div>
            <div
              className="rounded-2xl bg-white/10 p-4 lg:rounded-xl lg:p-3"
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
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:rounded-2xl lg:p-3">
              <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 lg:text-[9px]">
                Search FAQ
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Aether..."
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 lg:mt-2 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
              />

              <div className="mt-5 max-h-[55vh] space-y-2 overflow-y-auto overscroll-contain pr-2 lg:mt-4 lg:max-h-[calc(100vh-170px)] lg:space-y-1.5">
                {faqSections.map((section) => {
                  const tone = getToneClasses(section.tone);

                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="group flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 lg:rounded-xl lg:px-2.5 lg:py-2 lg:text-[11px]"
                    >
                      <span>{section.title}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] lg:px-1.5 lg:text-[8px] ${tone.chip}`}
                      >
                        {section.items.length}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-8 lg:space-y-6">
            <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 lg:text-[10px]">
                  Doctrine
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-950 lg:mt-2 lg:text-lg">
                  One connected campaign.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 lg:mt-2 lg:text-[11px] lg:leading-5">
                  Aether is built to help organizations understand what should
                  move together, not just what exists in separate tools.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 lg:text-[10px]">
                  Trust
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-950 lg:mt-2 lg:text-lg">
                  People and execution first.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 lg:mt-2 lg:text-[11px] lg:leading-5">
                  Execution can be reviewed, blocked, previewed, audited, and
                  governed before operational changes occur.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-4">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 lg:text-[10px]">
                  Identity
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-950 lg:mt-2 lg:text-lg">
                  Finance, Field, Outreach, Digital & Print.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 lg:mt-2 lg:text-[11px] lg:leading-5">
                  Aether treats people, lanes, lists, and execution context as
                  connected parts of one operational environment.
                </p>
              </div>
            </section>

            {filteredSections.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center lg:rounded-2xl lg:p-7">
                <h2 className="text-2xl font-black text-slate-950 lg:text-xl">
                  No FAQ results found.
                </h2>
                <p className="mt-2 text-slate-600 lg:text-sm">
                  Try searching for Finance, Outreach, Field, Digital, Print, Focus, or Contacts.
                </p>
              </div>
            ) : (
              filteredSections.map((section) => {
                const tone = getToneClasses(section.tone);

                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`scroll-mt-8 rounded-3xl border p-5 shadow-sm sm:p-6 lg:rounded-2xl lg:p-[18px] ${tone.card}`}
                  >
                    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200/70 pb-6 sm:flex-row sm:items-start sm:justify-between lg:mb-4 lg:gap-3 lg:pb-4">
                      <div>
                        <div
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] lg:px-2.5 lg:py-0.5 lg:text-[9px] ${tone.chip}`}
                        >
                          {section.eyebrow}
                        </div>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:mt-2 lg:text-2xl">
                          {section.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 lg:text-[11px] lg:leading-5">
                          {section.description}
                        </p>
                      </div>

                      <div
                        className={`h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br lg:h-10 lg:w-10 lg:rounded-xl ${tone.accent} shadow-sm`}
                      />
                    </div>

                    <div className="space-y-4 lg:space-y-3">
                      {section.items.map((item) => (
                        <details
                          key={item.question}
                          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm open:border-slate-300 lg:rounded-xl lg:p-4"
                        >
                          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 lg:gap-3">
                            <h3 className="text-base font-black text-slate-950 sm:text-lg lg:text-base">
                              {item.question}
                            </h3>
                            <span className="mt-0.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 transition group-open:rotate-45 lg:px-1.5 lg:py-0.5 lg:text-[9px]">
                              +
                            </span>
                          </summary>

                          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 lg:mt-3 lg:space-y-2 lg:pt-3">
                            {item.answer.map((line) => (
                              <p
                                key={line}
                                className="text-sm leading-7 text-slate-700 lg:text-[11px] lg:leading-5"
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                );
              })
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
                <h2 className="text-3xl font-black text-white lg:text-2xl">Don't click this.</h2>
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
                <h2 className="text-3xl font-black text-white lg:text-2xl">Seriously...? Final Warning...</h2>
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
                <div className="text-5xl lg:text-4xl" aria-hidden="true">⚠️ ⚠️ ⚠️</div>
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
                <h2 className="text-3xl font-black text-white lg:text-2xl">You've been warned...</h2>
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