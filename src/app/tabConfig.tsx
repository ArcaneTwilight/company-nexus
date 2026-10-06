import type { ReactNode } from "react";
import {
  LayoutGrid,
  BookOpen,
  Bookmark,
  Cpu,
  HelpCircle,
  Users,
  Calendar,
  Building2,
  FileText,
  ClipboardCheck,
  ListChecks,
} from "lucide-react";
import type { AppTab } from "./types";

export interface AppTabConfig {
  id: AppTab;
  label: string;
  icon: ReactNode;
}

export const APP_TABS: AppTabConfig[] = [
  { id: "dashboard", label: "Overview", icon: <LayoutGrid className="w-4 h-4 shrink-0" /> },
  { id: "tools", label: "Company Tools", icon: <Cpu className="w-4 h-4 shrink-0" /> },
  { id: "faqs", label: "Company FAQs", icon: <HelpCircle className="w-4 h-4 shrink-0" /> },
  { id: "kb", label: "Developer KB", icon: <BookOpen className="w-4 h-4 shrink-0" /> },
  { id: "links", label: "Quick Links", icon: <Bookmark className="w-4 h-4 shrink-0" /> },
  { id: "team", label: "Team Directory", icon: <Users className="w-4 h-4 shrink-0" /> },
  { id: "docs", label: "Knowledge Docs", icon: <FileText className="w-4 h-4 shrink-0" /> },
  { id: "calendar", label: "Team Calendar", icon: <Calendar className="w-4 h-4 shrink-0" /> },
  { id: "company", label: "Company List", icon: <Building2 className="w-4 h-4 shrink-0" /> },
  { id: "reports", label: "Report Upload", icon: <ClipboardCheck className="w-4 h-4 shrink-0" /> },
  { id: "trackers", label: "Trackers", icon: <ListChecks className="w-4 h-4 shrink-0" /> },
];
