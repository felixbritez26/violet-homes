import PropertyMap from './components/PropertyMap';
import PropertyImage from './components/PropertyImage';
import { useState } from "react";
import {
  Search as SearchIcon,
  Bell,
  Heart,
  ClipboardCheck,
  Inbox,
  House,
  X,
  ArrowRight,
} from "lucide-react";
import Search from "./pages/Search";
import Plan from "./pages/Plan";
import PropertyCard, { identity, money } from "./components/PropertyCard";
function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? initial;
    } catch {
      return initial;
    }
  });
  function update(next) {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }
  return [value, update];
}
const tabs = [
  ["Search", SearchIcon],
  ["Updates", Bell],
  ["Favorites", Heart],
  ["Plan", ClipboardCheck],
  ["Inbox", Inbox],
];
export default function App({ user }) {
  const [tab, setTab] = useState("Search"),
    [favorites, setFavorites] = useStored(`violet-favorites-${user.id}`, []),
    [searches, setSearches] = useStored(`violet-searches-${user.id}`, []),
    [plan, setPlan] = useStored(`violet-plan-${user.id}`, { done: [] }),
    [selected, setSelected] = useState(null),
    [notice, setNotice] = useState("");
  function save(item) {
    setFavorites(
      favorites.some((x) => identity(x) === identity(item))
        ? favorites.filter((x) => identity(x) !== identity(item))
        : [...favorites, item],
    );
  }
  function saveSearch(query) {
    setSearches([...searches, { ...query, id: Date.now() }]);
    setNotice("Search saved. Find it in Updates.");
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setTab("Search");
          }}
        >
          <span className="brand-icon">
            <House size={23} />
          </span>
          <span>
            violet<span className="brand-light">homes</span>
          </span>
        </a>
        <p className="nav-caption">YOUR SPACE</p>
        <nav>
          {tabs.map(([name, Icon]) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => {
                setTab(name);
                setNotice("");
              }}
            >
              <Icon size={21} />
              <span>{name}</span>
              {name === "Favorites" && favorites.length > 0 && (
                <small>{favorites.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            My workspace<small>Find somewhere you belong.</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <span className="mobile-brand">
            <House size={20} />
            violet homes
          </span>
          <span className="breadcrumb">
            My workspace <span>/ {tab}</span>
          </span>
          <span className="header-pill">A fresh perspective on home</span>
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
        </header>
        <main>
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button aria-label="Dismiss" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {tab === "Search" && (
            <Search
              favorites={favorites}
              onSave={save}
              onOpen={setSelected}
              onSaveSearch={saveSearch}
            />
          )}
          {tab === "Favorites" && (
            <>
              <div className="eyebrow">THE ONES THAT FEEL LIKE YOU</div>
              <h1>
                A little closer
                <br />
                <span>to home.</span>
              </h1>
              <p className="intro">
                Your shortlist, all in one place. Saved on this device.
              </p>
              {favorites.length ? (
                <div className="grid">
                  {favorites.map((item) => (
                    <PropertyCard
                      key={identity(item)}
                      item={item}
                      saved
                      onSave={save}
                      onOpen={setSelected}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  icon={Heart}
                  title="Room for your favorites"
                  text="Tap a heart on a property to start your collection."
                  action={() => setTab("Search")}
                />
              )}
            </>
          )}
          {tab === "Updates" && (
            <>
              <div className="eyebrow">STAY IN THE LOOP</div>
              <h1>
                Your search.
                <br />
                <span>Worth keeping.</span>
              </h1>
              <p className="intro">
                Manage saved searches on this device. Live notifications are not
                enabled.
              </p>
              {searches.length ? (
                searches.map((s) => (
                  <section className="saved-search" key={s.id}>
                    <Bell size={23} />
                    <div>
                      <h3>{s.city || "All cities"}</h3>
                      <p className="muted">
                        {s.targetBudget
                          ? `Budget ${money(s.targetBudget)}`
                          : "Any budget"}{" "}
                        · {s.keyword || "All descriptions"}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() =>
                        setSearches(searches.filter((x) => x.id !== s.id))
                      }
                    >
                      Remove
                    </button>
                  </section>
                ))
              ) : (
                <Empty
                  icon={Bell}
                  title="Keep a good search close"
                  text="Save your search from the Search panel to see it here."
                  action={() => setTab("Search")}
                />
              )}
            </>
          )}
          {tab === "Plan" && <Plan plan={plan} setPlan={setPlan} />}{" "}
          {tab === "Inbox" && (
            <>
              <div className="eyebrow">YOUR COMMUNICATIONS CENTER</div>
              <h1>
                Good things
                <br />
                <span>start with hello.</span>
              </h1>
              <p className="intro">A home for your future conversations.</p>
              <Empty
                icon={Inbox}
                title="Your inbox is quiet"
                text="Messaging is a demo panel. Agent conversations and message delivery are not connected."
                action={() => setTab("Search")}
              />
            </>
          )}
          <footer>
            VIOLET HOMES <span>Find your kind of place.</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav">
        {tabs.map(([name, Icon]) => (
          <button
            key={name}
            className={tab === name ? "active" : ""}
            onClick={() => {
              setTab(name);
              setNotice("");
            }}
          >
            <Icon size={21} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Property details"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="close"
              aria-label="Close details"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <div className="detail-photo"><PropertyImage item={selected}/></div>
            <div className="eyebrow">
              {selected.status} · {selected.source}
            </div>
            <h2>{selected.address}</h2>
            <p>
              {selected.city}, {selected.state} {selected.zip}
            </p>
            <h1>{money(selected.price)}</h1>
            <p>{selected.description}</p>
            <p className="muted">
              {selected.bedrooms} beds · {selected.bathrooms} baths ·{" "}
              {selected.sqft} ft²
            </p>
            <p className="muted">
              Listed {selected.listedDate} · Relevance{" "}
              {selected.score.toFixed(1)}/100
            </p>
            <PropertyMap items={[selected]}/>
            <a
              className="primary map-link"
              target="_blank"
              rel="noreferrer"
              href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}
            >
              View location <ArrowRight size={16} />
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
function Empty({ icon: Icon, title, text, action }) {
  return (
    <section className="empty">
      <span className="empty-icon">
        <Icon size={38} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="primary" onClick={action}>
        Explore homes <ArrowRight size={16} />
      </button>
    </section>
  );
}
