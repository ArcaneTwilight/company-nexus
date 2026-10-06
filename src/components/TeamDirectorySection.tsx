import { useEffect, useMemo, useState, Fragment } from "react";
import type { ContactTeam, TeamMember } from "../types";
import { Users, AlertTriangle, Plus, Building2 } from "lucide-react";
import { EmptyState, StaggerGrid, StaggerItem, GlassButton } from "./motion";
import { SectionToolbar } from "./shared";
import { TeamMemberModal } from "./TeamMemberModal";
import { ContactTeamsSection } from "../features/team/ContactTeamsSection";
import { TeamMemberCard } from "../features/team/TeamMemberCard";
import { useSyncedSearch } from "../hooks/useSyncedSearch";
import { useEntityModal } from "../hooks/useEntityModal";
import {
  TEAM_DESCRIPTIONS,
  collectTeamCategories,
  displayTeamRole,
} from "../lib/teamDirectory";

type DirectoryView = "members" | "teams";

interface TeamDirectorySectionProps {
  members: TeamMember[];
  contactTeams: ContactTeam[];
  initialSearch?: string;
  onUpsertMember: (member: TeamMember) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onUpsertTeam: (team: ContactTeam) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
}

interface MemberTeamGroup {
  team: string;
  description?: string;
  members: TeamMember[];
}

export default function TeamDirectorySection({
  members,
  contactTeams,
  initialSearch = "",
  onUpsertMember,
  onDeleteMember,
  onUpsertTeam,
  onDeleteTeam,
}: TeamDirectorySectionProps) {
  const [view, setView] = useState<DirectoryView>("members");
  const [searchTerm, setSearchTerm] = useSyncedSearch(initialSearch);
  const [selectedRole, setSelectedRole] = useState("All");
  const [now, setNow] = useState(() => new Date());
  const { open, editingItem: editingMember, openCreate, openEdit, close } =
    useEntityModal<TeamMember>();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const teamCategories = useMemo(
    () => collectTeamCategories(members.map((member) => member.role)),
    [members]
  );
  const roles = ["All", ...teamCategories];

  const filteredMembers = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(query) ||
        displayTeamRole(member.role).toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.timezone.toLowerCase().includes(query) ||
        member.contactNotes.toLowerCase().includes(query);
    const matchesRole =
      selectedRole === "All" || displayTeamRole(member.role) === selectedRole;
    return matchesSearch && matchesRole;
    });
  }, [members, searchTerm, selectedRole]);

  const membersByTeam = useMemo((): MemberTeamGroup[] => {
    const byTeam = new Map<string, TeamMember[]>();
    for (const member of filteredMembers) {
      const team = displayTeamRole(member.role) || "Unassigned";
      const list = byTeam.get(team) ?? [];
      list.push(member);
      byTeam.set(team, list);
    }

    const orderedTeams = [
      ...teamCategories.filter((team) => byTeam.has(team)),
      ...Array.from(byTeam.keys())
        .filter((team) => !teamCategories.includes(team))
        .sort((a, b) => a.localeCompare(b)),
    ];

    return orderedTeams.map((team) => ({
      team,
      description: TEAM_DESCRIPTIONS[team],
      members: byTeam.get(team) ?? [],
    }));
  }, [filteredMembers, teamCategories]);

  return (
    <div className="space-y-6">
      <div
        className="flex w-full max-w-md gap-1.5 rounded-xl border border-border bg-panel-solid p-1"
        role="tablist"
        aria-label="Team directory views"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "members"}
          onClick={() => setView("members")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            view === "members"
              ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/35"
              : "text-fg-muted hover:bg-white/5 hover:text-fg"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Company members
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "teams"}
          onClick={() => setView("teams")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            view === "teams"
              ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/35"
              : "text-fg-muted hover:bg-white/5 hover:text-fg"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Partner teams
        </button>
      </div>

      {view === "teams" ? (
        <ContactTeamsSection
          teams={contactTeams}
          initialSearch={initialSearch}
          onUpsert={onUpsertTeam}
          onDelete={onDeleteTeam}
        />
      ) : (
        <>
          <SectionToolbar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name, role, or email..."
            categories={roles}
            selectedCategory={selectedRole}
            onCategoryChange={setSelectedRole}
            categoryIcon={<Users className="w-4 h-4 text-fg-muted shrink-0" />}
            actions={
              <GlassButton variant="primary" onClick={openCreate} iconRight={<Plus className="w-4 h-4" />}>
                Add member
              </GlassButton>
            }
          />

          {filteredMembers.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="w-8 h-8" />}
              message="No team members found matching search parameters."
            />
          ) : (
            <div className="space-y-8">
              {membersByTeam.map((group) => (
                <section key={group.team} className="space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold font-display text-fg">
                        {group.team}
                      </h3>
                      {group.description ? (
                        <p className="mt-0.5 text-xs text-fg-muted font-sans font-light leading-relaxed">
                          {group.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle shrink-0">
                      {group.members.length}{" "}
                      {group.members.length === 1 ? "member" : "members"}
                    </span>
                  </div>

                  <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.members.map((member, index) => (
                      <Fragment key={member.id}>
                        <StaggerItem>
                          <TeamMemberCard
                            member={member}
                            index={index}
                            now={now}
                            onEdit={openEdit}
                          />
                        </StaggerItem>
                      </Fragment>
                    ))}
                  </StaggerGrid>
                </section>
              ))}
            </div>
          )}

          <TeamMemberModal
            open={open}
            member={editingMember}
            teamCategories={teamCategories}
            onClose={close}
            onSave={onUpsertMember}
            onDelete={onDeleteMember}
          />
        </>
      )}
    </div>
  );
}
