import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { money } from "./PropertyCard";

export default function PropertyMap({ items, onOpen }) {
  const container = useRef(null);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    const map = L.map(container.current, { scrollWheelZoom: false }).setView(
      [38.85, -77.3],
      10,
    );
    const tiles = L.tileLayer(
      `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=${encodeURIComponent(
        import.meta.env.VITE_CARTO_API_KEY,
      )}`,
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
          '&copy; <a href="https://carto.com/attribution/">CARTO</a>',
      },
    ).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    const groups = new Map();
    items.forEach((item) => {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude))
        return;
      const key = `${item.latitude},${item.longitude}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const points = [];
    groups.forEach((rows) => {
      const first = rows[0];
      const point = [first.latitude, first.longitude];
      points.push(point);
      const price = Math.min(...rows.map((x) => x.price));
      const label = `$${(price / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k${rows.length > 1 ? ` · ${rows.length}` : ""}`;
      const marker = L.marker(point, {
        icon: L.divIcon({
          className: "price-pin-wrap",
          html: `<span class="price-pin">${label}</span>`,
          iconSize: [95, 32],
          iconAnchor: [47, 16],
        }),
        title: rows.map((x) => `${x.address}: ${money(x.price)}`).join("; "),
      }).addTo(map);
      // Build DOM with textContent: listing text is never interpolated as HTML.
      const popup = document.createElement("div");
      popup.className = "map-popup";
      rows.forEach((item) => {
        const row = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = money(item.price);
        const address = document.createElement("p");
        address.textContent = item.address;
        const meta = document.createElement("small");
        meta.textContent = `${item.city} · ${item.status} · ${item.source}`;
        row.append(title, address, meta);
        if (onOpen) {
          const button = document.createElement("button");
          button.textContent = "View property";
          button.addEventListener("click", () => onOpen(item));
          row.append(button);
        }
        popup.append(row);
      });
      marker.bindPopup(popup);
    });
    if (points.length)
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [items, onOpen]);
  return (
    <section className="map-section">
      <div
        ref={container}
        className="property-map"
        aria-label="Map of listing locations"
      />
      {tileError && (
        <p className="map-note" role="status">
          Map background unavailable. Prices and the address list below are
          still available.
        </p>
      )}
      <p className="map-note">
        Locations and prices from the sample dataset. Shared coordinates are
        grouped. Map shows this page only.
      </p>
      <div className="map-results">
        {items.map((item) => (
          <button
            key={`${item.source}:${item.id}`}
            disabled={!onOpen}
            onClick={() => onOpen?.(item)}
          >
            <span>
              {item.address}
              <small>
                {item.city}, {item.state} · {item.source}
              </small>
            </span>
            <strong>{money(item.price)}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
