import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

const DEFAULT_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function IncidentMap({ location }) {
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
  }, [location?.latitude, location?.longitude]);

  if (!location) {
    return <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">No location was shared.</div>;
  }

  return (
    <div>
      <div ref={containerRef} className="h-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-100" aria-label="Incident location map" />
      {failed && <p className="mt-2 text-xs font-medium text-amber-700">Map tiles are unavailable. Use the verified coordinates below.</p>}
      <p className="mt-2 font-mono text-xs text-slate-700">
        {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)} · ±{Math.round(location.horizontalAccuracy || 0)} m · {location.precision || "unknown"} precision
      </p>
      <p className="mt-1 text-[11px] text-slate-400">Map data © OpenFreeMap and OpenStreetMap contributors.</p>
    </div>
  );
}
