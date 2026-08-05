import { Suspense, useMemo, useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowsClockwise,
  Bell,
  CaretDown,
  CreditCard,
  List,
  LockKey,
  SignOut,
  UserCircle,
  WarningCircle,
  Car,
  User,
  MapPin,
  ArrowUpRight,
} from "@phosphor-icons/react";
import {
  Button,
  IconButton,
  Popover,
  SearchInput,
  Sidebar,
  StatusDot,
  Topbar,
  ToastViewport,
} from "@navyug/ui";
import { navEntries, pageTitles } from "../config/nav";
import { routes } from "../config/routes";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";
import { useAlerts } from "../hooks/useAlerts";
import { useVehicles } from "../hooks/useVehicles";
import { useDrivers } from "../hooks/useDrivers";
import { useGeofences } from "../hooks/useGeofences";
import { alertVisuals, timeAgo } from "../lib/format";
import { ADDON_MODULE_MAP, ADDONS } from "../lib/addons";
import { ManageAddonsModal } from "../components/ManageAddonsModal";
import logoMark from "../assets/navyug-mark.png";

function activeSectionFor(pathname: string): string {
  if (pathname.startsWith("/tracking") || pathname.startsWith("/live-map")) return "livemap";
  if (pathname.startsWith("/trips")) return "livemap";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/add-device")) return "adddevice";
  if (pathname.startsWith("/fuel-log")) return "fuellog";
  const section = pathname.split("/")[1] || "dashboard";
  if (section === "vehicles") return "stats";
  if (section === "geofences") return "geofence";
  return section;
}

const ROUTE_MODULES: Record<string, string> = {
  [routes.liveMap]: "map",
  [routes.timeline]: "map",
  [routes.geofences]: "geo",
  [routes.devices]: "maint",
};

interface SearchItem {
  type: "page" | "vehicle" | "driver" | "geofence";
  label: string;
  sub?: string;
  path: string;
  category: "Quick Links" | "Vehicles" | "Drivers" | "Geofences";
}

function GlobalSearch() {
  const navigate = useNavigate();
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const { data: geofences = [] } = useGeofences();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Keyboard Shortcut (⌘K or Ctrl+K) to focus search
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // 2. Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Define searchable items
  const items = useMemo((): SearchItem[] => {
    const list: SearchItem[] = [];

    // Quick links / sections
    const defaultPages = [
      { type: "page", label: "Dashboard Overview", path: routes.dashboard, category: "Quick Links" },
      { type: "page", label: "Live Tracking Map", path: routes.liveMap, category: "Quick Links" },
      { type: "page", label: "Vehicle Activity Timeline", path: routes.timeline, category: "Quick Links" },
      { type: "page", label: "Fleet Financials & TCO", path: routes.financials, category: "Quick Links" },
      { type: "page", label: "Vehicle Performance & Stats", path: routes.stats, category: "Quick Links" },
      { type: "page", label: "Drivers List & Scorecards", path: routes.drivers, category: "Quick Links" },
      { type: "page", label: "Geofences Map", path: routes.geofences, category: "Quick Links" },
      { type: "page", label: "Billing & Subscriptions", path: routes.billing, category: "Quick Links" },
    ] as const;
    list.push(...defaultPages);

    // Vehicles
    vehicles.forEach((v) => {
      list.push({
        type: "vehicle",
        label: v.reg,
        sub: `${v.fuelType} · Driver: ${v.driverName} · Status: ${v.status}`,
        path: `/live-map?vehicleId=${v.id}`, // navigate and center on map
        category: "Vehicles",
      });
    });

    // Drivers
    drivers.forEach((d) => {
      list.push({
        type: "driver",
        label: d.name,
        sub: `Status: ${d.status}`,
        path: routes.drivers,
        category: "Drivers",
      });
    });

    // Geofences
    geofences.forEach((g) => {
      list.push({
        type: "geofence",
        label: g.name,
        sub: `${g.shape} zone · ${g.vehicleCount} vehicles`,
        path: routes.geofences,
        category: "Geofences",
      });
    });

    return list;
  }, [vehicles, drivers, geofences]);

  // 4. Filter items based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return items.filter((item) => 
      item.label.toLowerCase().includes(q) || 
      (item.sub && item.sub.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, items]);

  // 5. Handle navigate/execute selection
  const handleSelect = (item: SearchItem) => {
    navigate(item.path);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  // 6. Keyboard events in input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const activeItem = filtered[activeIndex];
      if (activeItem) {
        handleSelect(activeItem);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Reset active selection on query change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchInput
        ref={inputRef}
        label="Search vehicles, drivers…"
        shortcut="⌘K"
        className="h-8"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {/* Suggestion Dropdown */}
      {open && query.trim() !== "" && (
        <div className="absolute top-10 left-0 z-50 w-[320px] bg-white/95 dark:bg-[#1a1a1e]/95 backdrop-blur border border-line-soft rounded-xl shadow-2xl p-2 max-h-[380px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-6 px-3 text-center text-[12px] font-medium text-ink-faint">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-2">
              {["Quick Links", "Vehicles", "Drivers", "Geofences"].map((cat) => {
                const catItems = filtered.filter((i) => i.category === cat);
                if (catItems.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="px-2.5 py-1 text-[9px] font-black text-ink-faint tracking-wider uppercase">
                      {cat}
                    </div>
                    {catItems.map((item) => {
                      const globalIndex = filtered.indexOf(item);
                      const isHighlighted = globalIndex === activeIndex;

                      return (
                        <div
                          key={`${item.type}-${item.label}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setActiveIndex(globalIndex)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-[12px] ${
                            isHighlighted
                              ? "bg-brand/10 text-brand font-bold"
                              : "text-ink-muted hover:bg-surface-subtle"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.type === "page" && <ArrowUpRight size={13} className="shrink-0 text-brand" />}
                            {item.type === "vehicle" && <Car size={13} className="shrink-0 text-blue-500" />}
                            {item.type === "driver" && <User size={13} className="shrink-0 text-emerald-500" />}
                            {item.type === "geofence" && <MapPin size={13} className="shrink-0 text-purple-500" />}
                            <div className="min-w-0">
                              <div className="truncate font-sans font-bold leading-normal">{item.label}</div>
                              {item.sub && (
                                <div className="text-[10px] text-ink-faint truncate font-mono font-medium mt-0.5">
                                  {item.sub}
                                </div>
                              )}
                            </div>
                          </div>
                          {isHighlighted && <span className="text-[9.5px] font-bold font-mono text-brand/80">Enter</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isModuleEnabled } = useAuthStore();
  const { toasts, showToast, sidebarOpen, setSidebarOpen } = useUiStore();
  const { data: alerts } = useAlerts();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [addonsModalOpen, setAddonsModalOpen] = useState(false);
  const [highlightAddonId, setHighlightAddonId] = useState<string | null>(null);

  const activeId = activeSectionFor(location.pathname);
  const title = pageTitles[activeId] ?? "Navyug Fleet Platform";
  const recentAlerts = useMemo(() => (alerts ?? []).slice(0, 4), [alerts]);

  const requiredModule = ROUTE_MODULES[location.pathname];
  const isLockedPage = !!requiredModule && !isModuleEnabled(requiredModule);
  const lockedAddon = ADDONS.find((a) => ADDON_MODULE_MAP[a.id] === requiredModule);
  const lockedPageTitle = pageTitles[activeId] ?? "This page";

  function handleSignOut() {
    signOut();
    navigate(routes.login, { replace: true });
  }

  function openAddonManager(addonId?: string) {
    setHighlightAddonId(addonId ?? null);
    setAddonsModalOpen(true);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-app font-sans text-ink">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform lg:static lg:translate-x-0 h-full lg:h-full lg:flex lg:flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          logo={<img src={logoMark} alt="" className="h-[27px] w-[27px] shrink-0 object-contain" />}
          productName="Navyug"
          productTag="FLEET PLATFORM"
          items={navEntries}
          activeId={activeId}
          renderLink={(href, children) => (
            <Link to={href} onClick={() => setSidebarOpen(false)}>
              {children}
            </Link>
          )}
          footer={
            <>
              <StatusDot status="moving" pulse />
              LIVE · 5S SYNC
            </>
          }
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar title={title}>
          <IconButton
            icon={<List size={18} />}
            label="Open navigation menu"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          />
          <div className="ml-1 min-w-[80px] max-w-[280px] flex-1">
            <GlobalSearch />
          </div>
          <div className="ml-auto flex items-center gap-3.5">
            <IconButton
              icon={<ArrowsClockwise size={16} />}
              label="Refresh fleet data"
              onClick={() => showToast("Fleet data refreshed")}
            />
            <div className="relative">
              <IconButton
                icon={
                  <span className="relative flex">
                    <Bell size={17} />
                    {recentAlerts.length > 0 && (
                      <span className="absolute -right-1 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger font-mono text-[8px] font-bold text-white">
                        {recentAlerts.length}
                      </span>
                    )}
                  </span>
                }
                label={`Notifications (${recentAlerts.length} unread)`}
                onClick={() => setNotifOpen((o) => !o)}
              />
              <Popover open={notifOpen} onClose={() => setNotifOpen(false)} width={320}>
                <div className="border-b border-line-soft px-4 py-[13px] font-sans text-[13px] font-bold">
                  Notifications
                </div>
                {recentAlerts.map((a) => {
                  const v = alertVisuals[a.kind];
                  return (
                    <div key={a.id} className="flex gap-2.5 border-b border-surface-subtle px-4 py-[11px]">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: v.bg }}
                      >
                        <WarningCircle size={13} weight="fill" style={{ color: v.color }} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-sans text-[12px] font-semibold">{a.title}</div>
                        <div className="mt-0.5 font-mono text-[10.5px] text-ink-faint">
                          {a.vehicleReg} · {timeAgo(a.occurredAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Link
                  to={routes.events}
                  onClick={() => setNotifOpen(false)}
                  className="block px-4 py-[11px] text-center font-sans text-[12px] font-semibold text-brand"
                >
                  View all alerts →
                </Link>
              </Popover>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-tint font-sans text-[10.5px] font-bold text-brand">
                  {profile.initials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block font-sans text-[11.5px] font-semibold">{profile.name}</span>
                  <span className="block font-mono text-[10px] text-ink-faint">{profile.role}</span>
                </span>
                <CaretDown size={11} className="text-ink-faint" />
              </button>
              <Popover open={profileOpen} onClose={() => setProfileOpen(false)} width={220}>
                <div className="flex items-center gap-2.5 border-b border-line-soft px-4 py-[14px]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-tint font-sans text-[11.5px] font-bold text-brand">
                    {profile.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-sans text-[12.5px] font-bold">{profile.name}</div>
                    <div className="font-sans text-[10.5px] text-ink-faint">{profile.role}</div>
                  </div>
                </div>
                <Link
                  to={routes.profile}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-[10px] font-sans text-[12.5px] font-semibold text-ink-soft hover:bg-surface-subtle"
                >
                  <UserCircle size={15} />
                  My Profile
                </Link>
                <Link
                  to={routes.subscription}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-[10px] font-sans text-[12.5px] font-semibold text-ink-soft hover:bg-surface-subtle"
                >
                  <CreditCard size={15} />
                  Subscription
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 border-t border-line-soft px-4 py-[10px] font-sans text-[12.5px] font-semibold text-danger hover:bg-surface-subtle"
                >
                  <SignOut size={15} />
                  Sign Out
                </button>
              </Popover>
            </div>
          </div>
        </Topbar>

        <main className="relative flex min-h-0 flex-1 flex-col">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center animate-fade-in-delayed">
                <span
                  className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent"
                  role="status"
                  aria-label="Loading page"
                />
              </div>
            }
          >
            <div key={location.pathname} className="flex min-h-0 flex-1 flex-col animate-fade-in">
              <Outlet />
            </div>
          </Suspense>

          {isLockedPage && (
            <div className="absolute inset-0 z-[120] flex items-center justify-center bg-[#F1F3F7]/60 backdrop-blur-md">
              <div className="w-[410px] max-w-[90vw] rounded-2xl border border-line-soft bg-white p-[30px] text-center shadow-modal">
                <span className="inline-flex h-[54px] w-[54px] items-center justify-center rounded-[15px] bg-navy">
                  <LockKey size={25} weight="fill" className="text-[#F4D06F]" />
                </span>
                <div className="mt-[15px] font-sans text-[17.5px] font-bold tracking-tight text-ink">
                  {lockedPageTitle} needs an add-on
                </div>
                <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-ink-muted">
                  The base plan covers the live map, vehicles and drivers.{" "}
                  {lockedAddon ? (
                    <>Turn on <strong>{lockedAddon.label}</strong> to unlock this page.</>
                  ) : (
                    "Turn on this add-on to unlock this page."
                  )}
                </p>
                {lockedAddon && (
                  <div className="mt-4 rounded-[10px] border border-line-soft bg-surface-subtle py-2.5 font-sans text-[13px] font-bold text-navy">
                    {lockedAddon.label}{" "}
                    <span className="font-sans text-[11px] font-medium text-ink-faint">
                      {lockedAddon.per === "flat" ? `₹${lockedAddon.price}/mo flat` : `+₹${lockedAddon.price}/device/mo`}
                    </span>
                  </div>
                )}
                <div className="mt-3.5 flex gap-2">
                  <Link
                    to={routes.subscription}
                    className="flex h-[42px] flex-1 items-center justify-center rounded-[10px] border border-line-soft font-sans text-[12.5px] font-semibold text-ink-soft hover:bg-surface-subtle"
                  >
                    View plan
                  </Link>
                  <Button className="h-[42px] flex-1" onClick={() => openAddonManager(lockedAddon?.id)}>
                    Add to plan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <ToastViewport toasts={toasts} />

      <ManageAddonsModal
        open={addonsModalOpen}
        onClose={() => setAddonsModalOpen(false)}
        highlightAddonId={highlightAddonId}
      />
    </div>
  );
}
