import PropertyMap from '../components/PropertyMap';
import { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Bookmark,
} from "lucide-react";
import PropertyCard, { identity } from "../components/PropertyCard";
export const defaults = {
  city: "",
  minPrice: "",
  maxPrice: "",
  minBedrooms: "",
  keyword: "",
  targetBudget: "",
  pageSize: "6",
  status: "",
};
export default function Search({ favorites, onSave, onOpen, onSaveSearch }) {
  const [view, setView] = useState("list");
  const [form, setForm] = useState(defaults),
    [query, setQuery] = useState(defaults),
    [page, setPage] = useState(1),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [expanded, setExpanded] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/listings?" + new URLSearchParams({ ...query, page }), {
      signal: controller.signal,
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw Error(body.error || "Search failed");
        return body;
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, page, retry]);
  function submit(e) {
    e.preventDefault();
    setPage(1);
    setQuery({ ...form });
  }
  return (
    <>
      <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
      <h1>
        Find a place.
        <br />
        <span>Make it yours.</span>
      </h1>
      <p className="intro">Thoughtfully matched homes, one search away.</p>
      <form className="search-panel" onSubmit={submit}>
        <div className="search-line">
          <SearchIcon size={20} />
          <input
            aria-label="City"
            placeholder="Search a city, e.g. Springfield"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <button
            className="icon-button"
            type="button"
            aria-label="Toggle filters"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>
        <div className={"filters " + (expanded ? "expanded" : "")}>
          {[
            ["minPrice", "Min price"],
            ["maxPrice", "Max price"],
            ["minBedrooms", "Min bedrooms"],
            ["targetBudget", "Target budget"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min={key === "targetBudget" ? 1 : 0}
                step={1}
                placeholder="Any"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <label>
            Description keyword
            <input
              placeholder="e.g. yard"
              value={form.keyword}
              onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            />
          </label>
          <label>Listing status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="sold">Sold</option></select></label>
          <label>
            Per page
            <select
              value={form.pageSize}
              onChange={(e) => setForm({ ...form, pageSize: e.target.value })}
            >
              {[3, 6, 12].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="row actions">
          <button className="primary" type="submit">
            Search homes <SearchIcon size={16} />
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setForm(defaults);
              setQuery({ ...defaults });
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </form>
      <div className="section-title">
        <div>
          <h2>Discover your next home</h2>
          <p className="muted">
            {loading
              ? "Finding your matches…"
              : `${data?.total ?? 0} listings · ranked by relevance`}
          </p>
        </div>
        <button className="secondary" onClick={() => onSaveSearch(query)}>
          <Bookmark size={15} />
          Save search
        </button>
      </div>
      <div className="view-toggle" aria-label="Result view"><button className={view==="list"?"selected":""} onClick={()=>setView("list")}>List</button><button className={view==="map"?"selected":""} onClick={()=>setView("map")}>Map</button></div>
      {loading ? (
        <div className="empty" role="status">
          Finding the right places for you…
        </div>
      ) : error ? (
        <div className="empty" role="alert">
          <h2>Search unavailable</h2>
          <p>{error}</p>
          <button className="secondary" onClick={() => setRetry(retry + 1)}>
            Try again
          </button>
        </div>
      ) : !data?.items.length ? (
        <div className="empty">
          <h2>No homes found</h2>
          <p>Try another city or broader filters.</p>
        </div>
      ) : (
        <>
          {view === "map" ? <PropertyMap items={data.items} onOpen={onOpen}/> : <div className="grid">
            {data.items.map((item) => (
              <PropertyCard
                key={identity(item)}
                item={item}
                saved={favorites.some((x) => identity(x) === identity(item))}
                onSave={onSave}
                onOpen={onOpen}
              />
            ))}
          </div>}
          <div className="pagination">
            <button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              Page {page} of {data.totalPages}
            </span>
            <button
              aria-label="Next page"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </>
  );
}
