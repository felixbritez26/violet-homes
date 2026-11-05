import PropertyImage from "./PropertyImage";
import {
  Heart,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
export const identity = (x) => `${x.source}:${x.id}`;
export const money = (x) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(x);
export default function PropertyCard({ item, saved, onSave, onOpen }) {
  return (
    <article className="property">
      <div className="property-art">
        <PropertyImage item={item} />
        <span className="status">{item.status}</span>
        <button
          className={"heart " + (saved ? "saved" : "")}
          aria-label={saved ? "Remove favorite" : "Save favorite"}
          onClick={() => onSave(item)}
        >
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
        <span className="source">
          {item.source} · {item.id}
        </span>
      </div>
      <div className="property-body">
        <div className="row">
          <h2>{money(item.price)}</h2>
          <span className="match">{Number(item.score).toFixed(1)} match</span>
        </div>
        <h3>{item.address}</h3>
        <p className="muted location">
          <MapPin size={13} />
          {item.city}, {item.state} {item.zip}
        </p>
        <div className="specs">
          <span>
            <BedDouble size={15} />
            {item.bedrooms} beds
          </span>
          <span>
            <Bath size={15} />
            {item.bathrooms} baths
          </span>
          <span>
            <Maximize size={14} />
            {item.sqft.toLocaleString()} ft²
          </span>
        </div>
        <button className="details" onClick={() => onOpen(item)}>
          Explore property <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}
