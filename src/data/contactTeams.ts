import type { ContactTeam } from "../types";

/** Seed partner teams — ownership notes help humans and AI route questions. */
export const INITIAL_CONTACT_TEAMS: ContactTeam[] = [
  {
    id: "cteam-1",
    name: "Sales Team",
    category: "Sales",
    email: "sales@company.com",
    groupChat: "",
    notes:
      "Sample team for sales coordination, customer opportunities, and account handoffs.",
  },
  {
    id: "cteam-2",
    name: "HR Team",
    category: "HR",
    email: "hr@company.com",
    groupChat: "",
    notes: "Sample team for hiring, onboarding, and employee support.",
  },
  {
    id: "cteam-3",
    name: "Infrastructure Team",
    category: "Infrastructure",
    email: "infrastructure@company.com",
    groupChat: "",
    notes: "Sample team for cloud infrastructure, hosting, and operations.",
  },
  {
    id: "cteam-4",
    name: "IT Team",
    category: "IT",
    email: "it@company.com",
    groupChat: "",
    notes: "Sample team for internal systems, devices, and technical support.",
  },
  {
    id: "cteam-5",
    name: "Data Analysis Team",
    category: "Data Analysis",
    email: "dataanalysis@company.com",
    groupChat: "",
    notes: "Sample team for reporting, analytics, and data insights.",
  },
  {
    id: "cteam-6",
    name: "Server Team",
    category: "Server",
    email: "server@company.com",
    groupChat: "",
    notes: "Sample team for server-side services and backend support.",
  },
  {
    id: "cteam-7",
    name: "Web Development Team",
    category: "Web Development",
    email: "webdevelopment@company.com",
    groupChat: "",
    notes: "Sample team for web application development and maintenance.",
  },
];
