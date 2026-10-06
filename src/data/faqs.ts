import type { FAQItem } from "../types";

export const INITIAL_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    title: "How do we submit a new mobile app build for App Store or Google Play review?",
    category: "Process",
    tags: ["mobile-app", "publishing", "app-store", "google-play", "review"],
    body: "A build is submitted through the release pipeline after engineering completes QA validation, versioning, and release notes. The team uploads the binary to the appropriate store dashboard, verifies metadata, and confirms the app is ready for review before the store begins an approval check.",
    lastUpdated: "2026-07-15",
    isArchived: false
  },
  {
    id: "faq-2",
    title: "What are the required fields for a store listing before publishing?",
    category: "Process",
    tags: ["publishing", "app-store", "google-play", "metadata", "compliance"],
    body: "The store listing must include the app name, category, short description, full description, support contact, privacy policy URL, app icon, screenshots, and any required age rating and content disclosures. Missing information can delay approval or trigger a rejection by the store review team.",
    lastUpdated: "2026-07-11",
    isArchived: false
  },
  {
    id: "faq-3",
    title: "What is the required privacy policy for mobile apps?",
    category: "Compliance",
    tags: ["privacy", "compliance", "google-play", "app-store", "mobile-app"],
    body: "Apps must provide a clear and current privacy policy that explains data collection, third-party integrations, analytics usage, and user controls. The policy should be linked from the store listing and available inside the app where user consent or disclosure is required.",
    lastUpdated: "2026-07-09",
    isArchived: false
  },
  {
    id: "faq-4",
    title: "Who should we contact if a user reports an app crash or broken feature?",
    category: "General",
    tags: ["support", "contact", "mobile-app", "issue-reporting"],
    body: "Users should report issues through the mobile support channel, including app version, device model, OS version, and a description of the problem. The support team triages and routes the report to the engineering owner for review and escalation when needed.",
    lastUpdated: "2026-07-12",
    isArchived: false
  },
  {
    id: "faq-5",
    title: "How do we escalate policy violations or app removal notices?",
    category: "Compliance",
    tags: ["google-play", "app-store", "compliance", "escalation", "publishing"],
    body: "Policy violations should be escalated to the compliance lead and the product owner immediately. The team reviews the store notice, verifies whether the issue is valid, corrects the app or listing, and submits an appeal or remediation package when required.",
    lastUpdated: "2026-07-10",
    isArchived: false
  },
  {
    id: "faq-6",
    title: "What app updates require a new submission to the stores?",
    category: "Process",
    tags: ["updates", "publishing", "google-play", "app-store", "mobile-app"],
    body: "Any change to app functionality, permissions, store listing, privacy disclosures, or compliance-sensitive content typically requires a new or updated submission. Minor internal fixes may be released without a store listing change but should still be validated before rollout.",
    lastUpdated: "2026-07-05",
    isArchived: false
  },
  {
    id: "faq-7",
    title: "What contact information should be included in the app support page?",
    category: "General",
    tags: ["contact", "support", "app-store", "google-play", "mobile-app"],
    body: "The app support page should include a dedicated support email, a help center URL or support portal, and clear instructions for reporting bugs, requesting help, and submitting privacy concerns. This helps customers and regulators contact the right team quickly.",
    lastUpdated: "2026-07-08",
    isArchived: false
  },
  {
    id: "faq-8",
    title: "Can we publish an app update without updating the privacy policy?",
    category: "Compliance",
    tags: ["privacy", "updates", "app-store", "google-play", "compliance"],
    body: "No, not when an update affects data handling, ad technology, permissions, analytics, or user consent practices. If the update changes user data collection or retention, the privacy policy and disclosures must be reviewed and updated before release.",
    lastUpdated: "2026-07-03",
    isArchived: false
  },
  {
    id: "faq-9",
    title: "What app review turnaround should we expect from App Store and Google Play?",
    category: "Process",
    tags: ["review", "app-store", "google-play", "publishing", "timeline"],
    body: "Review timelines vary by platform, app complexity, and whether the submission is a new app or an update. Standard review windows are commonly used as planning estimates, but teams should allow extra time for rejections, policy clarification, or required fixes.",
    lastUpdated: "2026-07-01",
    isArchived: false
  },
  {
    id: "faq-10",
    title: "What is the process for handling customer complaints about incorrect app content?",
    category: "General",
    tags: ["contact", "support", "content", "mobile-app", "compliance"],
    body: "Complaints are logged by the support team and routed to the responsible product or compliance owner. The team validates the concern, removes or corrects the issue when appropriate, and documents any action taken for future audits and legal review.",
    lastUpdated: "2026-06-30",
    isArchived: false
  },
  {
    id: "faq-11",
    title: "How do we handle a Google Play policy warning or app suspension?",
    category: "Compliance",
    tags: ["google-play", "policy", "compliance", "suspension", "process"],
    body: "First, confirm the issue and identify the offending feature or listing element. Then remove or fix the policy risk, submit any required explanation, and resubmit the app only after the compliance lead confirms that the issue is fully addressed.",
    lastUpdated: "2026-06-28",
    isArchived: false
  },
  {
    id: "faq-12",
    title: "What information must be included in app update notes?",
    category: "Process",
    tags: ["updates", "release-notes", "google-play", "app-store", "publishing"],
    body: "Release notes should describe the major change, any user-facing improvements, bug fixes, security updates, and any functional impact. They should be clear enough for users to understand the value of the update while staying accurate and compliant with store guidance.",
    lastUpdated: "2026-06-27",
    isArchived: false
  },
  {
    id: "faq-13",
    title: "Where should we list our designated app support email?",
    category: "General",
    tags: ["contact", "support", "app-store", "google-play", "customer-service"],
    body: "Support contact details should appear in the app listing, in-app help section, and any user-facing support or privacy pages. Consistent contact information reduces confusion and helps users reach the correct team for complaints or technical concerns.",
    lastUpdated: "2026-06-26",
    isArchived: false
  },
  {
    id: "faq-14",
    title: "What are the app store requirements for age ratings and content categories?",
    category: "Compliance",
    tags: ["age-rating", "compliance", "google-play", "app-store", "content"],
    body: "Each app must provide a valid age rating and correct category classification based on content and functionality. The rating should reflect the actual user experience and include any sensitive or restricted content used in the app or ad inventory.",
    lastUpdated: "2026-06-25",
    isArchived: false
  },
  {
    id: "faq-15",
    title: "How do we manage app versioning and compatibility for new releases?",
    category: "Process",
    tags: ["versioning", "mobile-app", "publishing", "compatibility", "updates"],
    body: "Version numbers must follow the release plan and platform requirements, and compatibility checks should confirm supported OS versions and device ranges. Updates should be validated across target versions before they are submitted to the store.",
    lastUpdated: "2026-06-24",
    isArchived: false
  },
  {
    id: "faq-16",
    title: "Who approves app submission changes that affect legal or privacy disclosures?",
    category: "Compliance",
    tags: ["legal", "privacy", "compliance", "approval", "publishing"],
    body: "Changes that affect legal notices, privacy disclosures, user consent, or regulatory obligations require approval from legal and compliance stakeholders before the app is published or updated. This is essential for avoiding enforcement issues and unresolved obligations.",
    lastUpdated: "2026-06-23",
    isArchived: false
  },
  {
    id: "faq-17",
    title: "What should we do when a user reports a data privacy concern in the app?",
    category: "Compliance",
    tags: ["privacy", "contact", "security", "support", "mobile-app"],
    body: "The concern should be logged, reviewed for severity, and routed to the privacy or security lead. The team should confirm whether user data was involved, assess whether notification is required, and document the remediation steps for the record.",
    lastUpdated: "2026-06-20",
    isArchived: false
  },
  {
    id: "faq-18",
    title: "Are there restrictions on app content or ads before publication?",
    category: "Compliance",
    tags: ["content", "ads", "google-play", "app-store", "compliance"],
    body: "Both platforms have restrictions on deceptive practices, misleading advertising, prohibited content, and risky data collection. Any in-app promotions, sponsor placements, or custom content must be reviewed for policy compliance before release.",
    lastUpdated: "2026-06-19",
    isArchived: false
  },
  {
    id: "faq-19",
    title: "How do we remove or retire an app listing when a product ends?",
    category: "Process",
    tags: ["deactivation", "publishing", "google-play", "app-store", "process"],
    body: "App retirement should follow a defined checklist that includes notifying support, pausing marketing, verifying data retention obligations, and submitting the removal or deactivation request in the store dashboards. Legal and compliance review should confirm the timing and user messaging.",
    lastUpdated: "2026-06-18",
    isArchived: false
  },
  {
    id: "faq-20",
    title: "What is the standard escalation path for app concerns raised by leadership or regulators?",
    category: "Compliance",
    tags: ["contact", "escalation", "privacy", "compliance", "mobile-app"],
    body: "Leadership and regulator inquiries should go to the privacy and compliance lead, with the product owner and legal counsel looped in based on scope. The team reviews the request, confirms facts, and prepares a documented response within the required timeline.",
    lastUpdated: "2026-06-17",
    isArchived: false
  }
];
