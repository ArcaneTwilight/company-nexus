import {
  PackageOpen,
  Smartphone,
  Wrench,
  Search,
  Server,
  type LucideIcon,
} from "lucide-react";

export type TeamIcon = LucideIcon;

export interface TeamLegendItem {
  id: string;
  label: string;
  icons: TeamIcon[];
  regions: string[];
}

export const TEAM_LEGEND: TeamLegendItem[] = [
  {
    id: "pss",
    label: "App Support",
    icons: [PackageOpen],
    regions: ["Philippines"],
  },
  {
    id: "pse",
    label: "Production Software Engineers",
    icons: [Smartphone],
    regions: ["Hanoi", "Philippines"],
  },
  {
    id: "mobile",
    label: "Mobile Development Team",
    icons: [Wrench],
    regions: ["Hanoi"],
  },
  {
    id: "qa",
    label: "Quality Assurance",
    icons: [Search],
    regions: ["Chennai"],
  },
  {
    id: "server",
    label: "Server Time",
    icons: [Server],
    regions: ["Estonia"],
  },
];

export interface RegionTeamIcon {
  icon: TeamIcon;
  label: string;
}

export function getRegionIcons(regionName: string): RegionTeamIcon[] {
  const icons: RegionTeamIcon[] = [];
  for (const entry of TEAM_LEGEND) {
    if (entry.regions.includes(regionName)) {
      for (const icon of entry.icons) {
        if (!icons.some((item) => item.icon === icon)) {
          icons.push({ icon, label: entry.label });
        }
      }
    }
  }
  return icons;
}
