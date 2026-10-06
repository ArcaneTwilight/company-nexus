import { AnimatePresence } from "motion/react";
import ClockSection from "../components/ClockSection";
import MetricsSection from "../components/MetricsSection";
import ToolsSection from "../components/ToolsSection";
import FAQSection from "../components/FAQSection";
import KBSection from "../components/KBSection";
import LinksSection from "../components/LinksSection";
import TeamDirectorySection from "../components/TeamDirectorySection";
import TeamCalendarSection from "../components/TeamCalendarSection";
import OverviewCalendar from "../components/OverviewCalendar";
import IRAppListSection from "../components/IRAppListSection";
import { ReportTrackerSection } from "../components/ReportTrackerSection";
import { KanbanSection } from "../features/kanban/KanbanSection";
import { TrackersSection } from "../features/production-tracker/TrackersSection";
import KnowledgeDocsSection from "../components/KnowledgeDocsSection";
import StockExchangeSection from "../components/StockExchangeSection";
import { RotatingEarth } from "../features/dashboard/globe/RotatingEarth";
import { PageTransition, SectionHeader } from "../components/motion";
import { TEAM_GLOBE_MARKERS } from "../data";
import type { UseNexusDataResult } from "../hooks/useNexusData";
import type { AppTab } from "./types";

interface TabContentProps {
  activeTab: AppTab;
  sectionFilter: string;
  nexus: UseNexusDataResult;
  onNavigate: (tab: AppTab, filter?: string) => void;
}

export function TabContent({
  activeTab,
  sectionFilter,
  nexus,
  onNavigate,
}: TabContentProps) {
  const {
    tools,
    faqs,
    articles,
    links,
    companyApps,
    calendarEvents,
    teamMembers,
    contactTeams,
    knowledgeDocs,
    stockExchanges,
    kanbanBoards,
    kanbanCards,
    reportTracker,
    productionTracker,
    actions,
  } = nexus;

  return (
    <main className="min-h-[400px]">
      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && (
          <PageTransition className="space-y-6">
            {/* Row 1: Metrics full width */}
            <MetricsSection companyApps={companyApps} />

            {/* Row 2: Calendar + Wireframe map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-8 min-w-0">
                <OverviewCalendar
                  events={calendarEvents}
                  onOpenCalendar={() => onNavigate("calendar")}
                  compact
                />
              </div>
              <div className="lg:col-span-4 min-w-0">
                <RotatingEarth markers={TEAM_GLOBE_MARKERS} height={280} />
              </div>
            </div>

            {/* Row 3: Global team clocks */}
            <ClockSection compact />

            {/* Row 4: Global stock exchange */}
            <StockExchangeSection
              exchanges={stockExchanges}
              onUpsert={actions.upsertStockExchange}
              onDelete={actions.deleteStockExchange}
            />
          </PageTransition>
        )}

        {activeTab === "tools" && (
          <PageTransition>
            <SectionHeader
              title="Tool List & Links"
              description="Direct access links to tools and web apps."
            />
            <ToolsSection
              tools={tools}
              initialSearch={sectionFilter}
              onUpsert={actions.upsertTool}
              onDelete={actions.deleteTool}
            />
          </PageTransition>
        )}

        {activeTab === "faqs" && (
          <PageTransition>
            <SectionHeader
              title="Repository"
              description="Search workflow guides and browse the FAQ repository."
            />
            <FAQSection
              faqs={faqs}
              initialSearch={sectionFilter}
              onUpsert={actions.upsertFaq}
              onDelete={actions.deleteFaq}
            />
          </PageTransition>
        )}

        {activeTab === "kb" && (
          <PageTransition>
            <SectionHeader
              title="Company Development Knowledge Board"
              description="App architecture, guides, and processes."
            />
            <KBSection
              articles={articles}
              initialSearch={sectionFilter}
              onUpsert={actions.upsertArticle}
              onDelete={actions.deleteArticle}
            />
          </PageTransition>
        )}

        {activeTab === "links" && (
          <PageTransition>
            <SectionHeader
              title="Bookmarked Links"
              description="External and internal links organized for immediate navigation."
            />
            <LinksSection
              links={links}
              initialSearch={sectionFilter}
              onUpsert={actions.upsertLink}
              onDelete={actions.deleteLink}
            />
          </PageTransition>
        )}

        {activeTab === "team" && (
          <PageTransition>
            <SectionHeader
              title="Team Directory"
              description="Company members, plus partner teams with ownership notes and contact channels."
            />
            <TeamDirectorySection
              members={teamMembers}
              contactTeams={contactTeams}
              initialSearch={sectionFilter}
              onUpsertMember={actions.upsertTeamMember}
              onDeleteMember={actions.deleteTeamMember}
              onUpsertTeam={actions.upsertContactTeam}
              onDeleteTeam={actions.deleteContactTeam}
            />
          </PageTransition>
        )}

        {activeTab === "docs" && (
          <PageTransition>
            <SectionHeader
              title="Document Repository"
              description="Markdown reports and long-form docs for AI retrieval."
            />
            <KnowledgeDocsSection
              docs={knowledgeDocs}
              initialSearch={sectionFilter}
              onUpsert={actions.upsertKnowledgeDoc}
              onDelete={actions.deleteKnowledgeDoc}
            />
          </PageTransition>
        )}

        {activeTab === "calendar" && (
          <PageTransition>
            <SectionHeader
              title="Team Calendar"
              description="Essential deadlines for reports, events, uploads, and releases."
            />
            <TeamCalendarSection
              events={calendarEvents}
              initialSearch={sectionFilter}
              onUpsert={actions.upsertCalendarEvent}
              onDelete={actions.deleteCalendarEvent}
            />
          </PageTransition>
        )}

        {activeTab === "company" && (
          <PageTransition>
            <SectionHeader
              title="Client List"
              description="Master list of companies and their status."
            />
            <IRAppListSection
              apps={companyApps}
              initialSearch={sectionFilter}
              onUpsert={actions.upsertcompanyApp}
            />
          </PageTransition>
        )}

        {activeTab === "reports" && (
          <PageTransition>
            <SectionHeader
              title="Report Upload"
              description="Track quarterly report uploads across Company clients (Q1–Q4)."
            />
            <ReportTrackerSection
              apps={companyApps}
              entries={reportTracker}
              onUpsert={actions.upsertReportTrackerEntry}
              initialSearch={sectionFilter}
            />
          </PageTransition>
        )}

        {activeTab === "trackers" && (
          <PageTransition>
            <SectionHeader
              title="Trackers"
              description="Internal production workflow and external-facing status and discussion briefs."
            />
            <TrackersSection
              apps={companyApps}
              entries={productionTracker}
              onUpsert={actions.upsertProductionTrackerEntry}
              initialSearch={sectionFilter}
            />
          </PageTransition>
        )}

        {activeTab === "kanban" && (
          <PageTransition>
            <SectionHeader
              title="Kanban Boards"
              description="Track development tasks and projects with drag-and-drop boards."
            />
            <KanbanSection
              boards={kanbanBoards}
              cards={kanbanCards}
              actions={actions}
            />
          </PageTransition>
        )}
      </AnimatePresence>
    </main>
  );
}
