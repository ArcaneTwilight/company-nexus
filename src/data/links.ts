import type { QuickLink } from "../types";

export const INITIAL_QUICK_LINKS: QuickLink[] = [
  {
    id: "link-1",
    title: "Workday HCM",
    url: "https://workday.company.com",
    category: "Internal Systems",
    notes: "Employee self-service, leave requests, and performance check-ins."
  },
  {
    id: "link-2",
    title: "Clockify Time Tracking",
    url: "https://clockify.company.com",
    category: "Internal Systems",
    notes: "Log daily operational, client-support, and project-based hours."
  },
  {
    id: "link-3",
    title: "Knowledge Base",
    url: "https://knowledge.company.com",
    category: "Reference Docs",
    notes: "Central corporate information, legal documentation, and onboarding decks."
  }
];
