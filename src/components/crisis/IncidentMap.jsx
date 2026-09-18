import { useEffect, useRef, useState } from "react";
import { Compass, Route } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

const DEFAULT_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function IncidentMap({ location, locationHistory = [] }) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !Number.isFinite(location?.longitude) || !Number.isFinite(location?.latitude)) return undefined;
    setFailed(false);
    let map;
    let cancelled = false;
    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !containerRef.current) return;
      map = new maplibregl.Map({
        container: containerRef.current,
        style: import.meta.env.VITE_MAP_STYLE_URL || DEFAULT_STYLE,
        center: [location.longitude, location.latitude],
        zoom: 15,
        attributionControl: true,
      });
      map.on("error", () => setFailed(true));

      // Draw breadcrumb path if multiple historical waypoints exist
      const validPoints = (locationHistory || [])
        .filter((pt) => Number.isFinite(pt.latitude) && Number.isFinite(pt.longitude))
        .map((pt) => [pt.longitude, pt.latitude]);

      map.on("load", () => {
        if (validPoints.length > 1) {
          map.addSource("movement-trail", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: validPoints,
              },
            },
          });
          map.addLayer({
            id: "movement-trail-line",
            type: "line",
            source: "movement-trail",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#e11d48",
              "line-width": 4,
              "line-opacity": 0.85,
            },
          });

          // Draw small dots for past waypoints (all except the latest)
          validPoints.slice(0, -1).forEach((coords) => {
            const dot = document.createElement("div");
            dot.style.width = "8px";
            dot.style.height = "8px";
            dot.style.borderRadius = "50%";
            dot.style.backgroundColor = "#fda4af";
            dot.style.border = "1.5px solid #e11d48";
            new maplibregl.Marker({ element: dot })
              .setLngLat(coords)
              .addTo(map);
          });
        }
      });

      // Latest / Current position marker
      new maplibregl.Marker({ color: "#e11d48" })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map);
    }).catch(() => {
      setFailed(true);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [location?.latitude, location?.longitude, locationHistory]);

  if (!location) {
    return <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">No location was shared.</div>;
  }

  const waypointsCount = locationHistory?.length || 1;

  return (
    <div>
      <div ref={containerRef} className="h-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-100" aria-label="Incident location map" />
      {failed && <p className="mt-2 text-xs font-medium text-amber-700">Map tiles are unavailable. Use the verified coordinates below.</p>}
      
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs text-slate-700">
          {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)} · ±{Math.round(location.horizontalAccuracy || 0)} m · {location.precision || "unknown"} precision
        </p>
        {waypointsCount > 1 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <Route size={12} /> {waypointsCount} waypoints tracked (past 1h)
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">Map data © OpenFreeMap and OpenStreetMap contributors.</p>
        <a
          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline"
        >
          <Compass size={13} /> Open in Google Maps
        </a>
      </div>
    </div>
  );
}
