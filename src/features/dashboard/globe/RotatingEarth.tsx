import { useEffect, useId, useRef, useState } from "react";
import * as d3 from "d3";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import type { TeamGlobeMarker } from "../../../data/teamGlobeMarkers";
import { useTheme } from "../../../hooks/useTheme";
import type { Theme } from "../../../lib/theme";

interface RotatingEarthProps {
  markers?: TeamGlobeMarker[];
  width?: number;
  height?: number;
  className?: string;
  /** Path to Natural Earth land GeoJSON (served from /public). */
  landUrl?: string;
}

interface DotData {
  lng: number;
  lat: number;
}

interface GlobePalette {
  ocean: string;
  outline: string;
  graticule: string;
  landStroke: string;
  landDot: string;
  hintBg: string;
  hintFg: string;
}

function paletteForTheme(theme: Theme): GlobePalette {
  if (theme === "light") {
    return {
      ocean: "#e2e8f0",
      outline: "#334155",
      graticule: "rgba(51, 65, 85, 0.28)",
      landStroke: "#475569",
      landDot: "#64748b",
      hintBg: "rgba(255, 255, 255, 0.9)",
      hintFg: "#334155",
    };
  }
  return {
    ocean: "#050505",
    outline: "#f8fafc",
    graticule: "rgba(248, 250, 252, 0.22)",
    landStroke: "#e2e8f0",
    landDot: "#94a3b8",
    hintBg: "rgba(15, 23, 42, 0.9)",
    hintFg: "#94a3b8",
  };
}

function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInFeature(point: [number, number], feature: Feature<Polygon | MultiPolygon>): boolean {
  const geometry = feature.geometry;
  if (geometry.type === "Polygon") {
    const coordinates = geometry.coordinates;
    if (!pointInPolygon(point, coordinates[0] as number[][])) return false;
    for (let i = 1; i < coordinates.length; i++) {
      if (pointInPolygon(point, coordinates[i] as number[][])) return false;
    }
    return true;
  }
  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) {
      if (!pointInPolygon(point, polygon[0] as number[][])) continue;
      let inHole = false;
      for (let i = 1; i < polygon.length; i++) {
        if (pointInPolygon(point, polygon[i] as number[][])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

function generateDotsInPolygon(feature: Feature<Geometry>, dotSpacing = 16): [number, number][] {
  if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") {
    return [];
  }
  const landFeature = feature as Feature<Polygon | MultiPolygon>;
  const dots: [number, number][] = [];
  const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(landFeature);
  const stepSize = dotSpacing * 0.08;

  for (let lng = minLng; lng <= maxLng; lng += stepSize) {
    for (let lat = minLat; lat <= maxLat; lat += stepSize) {
      const point: [number, number] = [lng, lat];
      if (pointInFeature(point, landFeature)) dots.push(point);
    }
  }
  return dots;
}

function isOnFrontHemisphere(
  projection: d3.GeoProjection,
  lng: number,
  lat: number,
): boolean {
  const rotate = projection.rotate();
  const center: [number, number] = [-rotate[0], -rotate[1]];
  return d3.geoDistance(center, [lng, lat]) <= Math.PI / 2;
}

export function RotatingEarth({
  markers = [],
  width = 560,
  height = 360,
  className = "",
  landUrl = "/geo/ne_110m_land.json",
}: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<TeamGlobeMarker | null>(null);
  const { theme } = useTheme();
  const legendId = useId();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let cancelled = false;
    let autoRotate = true;
    let isVisible = true;
    const rotation: [number, number, number] = [0, -10, 0];
    const rotationSpeed = 0.35;
    const allDots: DotData[] = [];
    let landFeatures: FeatureCollection | null = null;
    let baseRadius = 1;
    let containerWidth = width;
    let containerHeight = height;
    let pulsePhase = 0;
    const palette = paletteForTheme(theme);

    const projection = d3.geoOrthographic().clipAngle(90);
    const path = d3.geoPath().projection(projection).context(context);

    function resize() {
      const rect = container!.getBoundingClientRect();
      containerWidth = Math.max(280, Math.floor(rect.width || width));
      containerHeight = Math.max(220, Math.floor(height));
      baseRadius = Math.min(containerWidth, containerHeight) / 2.35;

      const dpr = window.devicePixelRatio || 1;
      canvas!.width = containerWidth * dpr;
      canvas!.height = containerHeight * dpr;
      canvas!.style.width = `${containerWidth}px`;
      canvas!.style.height = `${containerHeight}px`;
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);

      projection
        .scale(baseRadius)
        .translate([containerWidth / 2, containerHeight / 2])
        .rotate(rotation);
    }

    function render() {
      if (!context) return;
      context.clearRect(0, 0, containerWidth, containerHeight);

      const currentScale = projection.scale();
      const scaleFactor = currentScale / baseRadius;
      const [cx, cy] = projection.translate();

      context.beginPath();
      context.arc(cx, cy, currentScale, 0, 2 * Math.PI);
      context.fillStyle = palette.ocean;
      context.fill();
      context.strokeStyle = palette.outline;
      context.lineWidth = 1.5 * scaleFactor;
      context.stroke();

      if (landFeatures) {
        context.beginPath();
        path(d3.geoGraticule()());
        context.strokeStyle = palette.graticule;
        context.lineWidth = 0.8 * scaleFactor;
        context.stroke();

        context.beginPath();
        for (const feature of landFeatures.features) {
          path(feature);
        }
        context.strokeStyle = palette.landStroke;
        context.lineWidth = 0.9 * scaleFactor;
        context.stroke();

        for (const dot of allDots) {
          if (!isOnFrontHemisphere(projection, dot.lng, dot.lat)) continue;
          const projected = projection([dot.lng, dot.lat]);
          if (!projected) continue;
          context.beginPath();
          context.arc(projected[0], projected[1], 1.1 * scaleFactor, 0, 2 * Math.PI);
          context.fillStyle = palette.landDot;
          context.fill();
        }
      }

      const pulse = 0.5 + 0.5 * Math.sin(pulsePhase);

      for (const marker of markers) {
        if (!isOnFrontHemisphere(projection, marker.lng, marker.lat)) continue;
        const projected = projection([marker.lng, marker.lat]);
        if (!projected) continue;
        const [x, y] = projected;

        context.beginPath();
        context.arc(x, y, (4 + pulse * 5) * scaleFactor, 0, 2 * Math.PI);
        context.strokeStyle = marker.color;
        context.globalAlpha = 0.35 + pulse * 0.25;
        context.lineWidth = 1.5 * scaleFactor;
        context.stroke();
        context.globalAlpha = 1;

        context.beginPath();
        context.arc(x, y, 3.2 * scaleFactor, 0, 2 * Math.PI);
        context.fillStyle = marker.color;
        context.fill();
        context.strokeStyle = palette.outline;
        context.lineWidth = 1 * scaleFactor;
        context.stroke();
      }
    }

    async function loadWorldData() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(landUrl);
        if (!response.ok) throw new Error("Failed to load land data");
        const data = (await response.json()) as FeatureCollection;
        if (cancelled) return;

        landFeatures = data;
        allDots.length = 0;
        for (const feature of data.features) {
          for (const [lng, lat] of generateDotsInPolygon(feature, 18)) {
            allDots.push({ lng, lat });
          }
        }
        render();
        setIsLoading(false);
      } catch {
        if (!cancelled) {
          setError("Failed to load land map data");
          setIsLoading(false);
        }
      }
    }

    const rotationTimer = d3.timer(() => {
      if (!isVisible) return;
      pulsePhase += 0.06;
      if (autoRotate) {
        rotation[0] += rotationSpeed;
        projection.rotate(rotation);
      }
      render();
    });

    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false;
      const startX = event.clientX;
      const startY = event.clientY;
      const startRotation = [...rotation] as [number, number, number];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.45;
        rotation[0] = startRotation[0] + (moveEvent.clientX - startX) * sensitivity;
        rotation[1] = Math.max(
          -90,
          Math.min(90, startRotation[1] - (moveEvent.clientY - startY) * sensitivity),
        );
        projection.rotate(rotation);
        render();
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        window.setTimeout(() => {
          autoRotate = true;
        }, 800);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleHover = (event: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      let nearest: TeamGlobeMarker | null = null;
      let best = 14;

      for (const marker of markers) {
        if (!isOnFrontHemisphere(projection, marker.lng, marker.lat)) continue;
        const projected = projection([marker.lng, marker.lat]);
        if (!projected) continue;
        const dist = Math.hypot(projected[0] - mx, projected[1] - my);
        if (dist < best) {
          best = dist;
          nearest = marker;
        }
      }
      setHovered(nearest);
    };

    const handleMouseLeave = () => setHovered(null);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      render();
    });
    resizeObserver.observe(container);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.1 },
    );
    visibilityObserver.observe(container);

    resize();
    void loadWorldData();

    canvas.addEventListener("mousedown", handleMouseDown);

    canvas.addEventListener("mousemove", handleHover);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelled = true;
      rotationTimer.stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("mousedown", handleMouseDown);

      canvas.removeEventListener("mousemove", handleHover);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [width, height, landUrl, markers, theme]);

  if (error) {
    return (
      <div
        className={`flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-border bg-panel p-6 ${className}`}
      >
        <div className="text-center">
          <p className="mb-1 text-sm font-semibold text-fg">Could not load globe</p>
          <p className="text-xs text-fg-subtle">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-border bg-panel ${className}`}
      aria-labelledby={legendId}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div>
          <h3 id={legendId} className="text-sm font-semibold tracking-tight text-fg">
            Team Locations
          </h3>
          <p className="text-[11px] font-mono text-fg-subtle">Hub map</p>
        </div>
        {isLoading && (
          <span className="text-[11px] font-mono text-fg-subtle animate-pulse">Loading map…</span>
        )}
      </div>

      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="block w-full cursor-grab active:cursor-grabbing"
          aria-label="Interactive wireframe globe with team location markers"
        />

        {hovered && (
          <div
            className="pointer-events-none absolute left-3 top-3 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium shadow-lg"
            style={{ background: paletteForTheme(theme).hintBg, color: paletteForTheme(theme).hintFg }}
          >
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
              style={{ backgroundColor: hovered.color }}
            />
            {hovered.label}
          </div>
        )}

        <div
          className="pointer-events-none absolute bottom-3 left-3 rounded-md px-2 py-1 text-[10px] font-mono"
          style={{ background: paletteForTheme(theme).hintBg, color: paletteForTheme(theme).hintFg }}
        >
          Drag to rotate
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border px-4 py-2.5">
        {markers.map((marker) => (
          <li key={marker.id} className="flex items-center gap-1.5 text-[11px] text-fg-muted">
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: marker.color }}
              aria-hidden
            />
            {marker.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RotatingEarth;
