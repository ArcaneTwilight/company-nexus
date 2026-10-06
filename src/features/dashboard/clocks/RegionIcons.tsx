import { IconTooltip } from "../../../components/shared/IconTooltip";
import { getRegionIcons } from "./teamLegend";

interface RegionIconsProps {
  regionName: string;
}

export function RegionIcons({ regionName }: RegionIconsProps) {
  const icons = getRegionIcons(regionName);
  if (icons.length === 0) return <div className="h-5 mb-1" />;

  return (
    <div className="flex items-center justify-center gap-1 mb-1">
      {icons.map(({ icon: Icon, label }, index) => (
        <IconTooltip key={`${regionName}-${index}`} label={label}>
          <Icon
            className="w-4 h-4 text-fg-muted shrink-0"
            strokeWidth={1.5}
            aria-label={label}
          />
        </IconTooltip>
      ))}
    </div>
  );
}
