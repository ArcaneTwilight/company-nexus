export interface TeamGlobeMarker {
  id: string;
  label: string;
  timezone: string;
  clockLabel: string;
  lng: number;
  lat: number;
  /** Accent fill for the ping (works on dark + light globe). */
  color: string;
}

/** Hub cities shown as pings on the dashboard globe. */
export const TEAM_GLOBE_MARKERS: TeamGlobeMarker[] = [
  {
    id: "manila",
    label: "Manila",
    timezone: "Asia/Manila",
    clockLabel: "Manila (PHT)",
    lng: 120.9842,
    lat: 14.5995,
    color: "#38bdf8",
  },
  {
    id: "vietnam",
    label: "Vietnam",
    timezone: "Asia/Ho_Chi_Minh",
    clockLabel: "Vietnam (ICT)",
    lng: 105.8542,
    lat: 21.0285,
    color: "#34d399",
  },
  {
    id: "chennai",
    label: "Chennai",
    timezone: "Asia/Kolkata",
    clockLabel: "Chennai (IST)",
    lng: 80.2707,
    lat: 13.0827,
    color: "#fbbf24",
  },
  {
    id: "hongkong",
    label: "Hong Kong",
    timezone: "Asia/Hong_Kong",
    clockLabel: "Hong Kong (HKT)",
    lng: 114.1694,
    lat: 22.3193,
    color: "#f472b6",
  },
  {
    id: "kathmandu",
    label: "Kathmandu",
    timezone: "Asia/Kathmandu",
    clockLabel: "Kathmandu (NPT)",
    lng: 85.324,
    lat: 27.7172,
    color: "#a78bfa",
  },
  {
    id: "kuala-lumpur",
    label: "Kuala Lumpur",
    timezone: "Asia/Kuala_Lumpur",
    clockLabel: "Kuala Lumpur (MYT)",
    lng: 101.6869,
    lat: 3.139,
    color: "#fb7185",
  },
  {
    id: "dubai",
    label: "Dubai",
    timezone: "Asia/Dubai",
    clockLabel: "Dubai (GST)",
    lng: 55.2708,
    lat: 25.2048,
    color: "#2dd4bf",
  },
  {
    id: "london",
    label: "London",
    timezone: "Europe/London",
    clockLabel: "London (GMT/BST)",
    lng: -0.1278,
    lat: 51.5074,
    color: "#60a5fa",
  },
  {
    id: "argentina",
    label: "Argentina",
    timezone: "America/Argentina/Buenos_Aires",
    clockLabel: "Argentina (ART)",
    lng: -58.3816,
    lat: -34.6037,
    color: "#f97316",
  },
];
