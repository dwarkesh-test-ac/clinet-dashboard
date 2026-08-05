import { create } from "zustand";
import { ADDON_MODULE_MAP, DEFAULT_ADDONS } from "../lib/addons";

const SESSION_KEY = "navyug.session";
const SESSION_CLIENT_KEY = "navyug.client";
const SESSION_COMPANY_KEY = "navyug.company";
const SESSION_TIER_KEY = "navyug.tier";
const SESSION_MODULES_KEY = "navyug.modules";

interface Profile {
  name: string;
  role: string;
  email: string;
  initials: string;
  companyName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  profile: Profile;
  clientId: string | null;
  tier: string | null;
  modules: Record<string, boolean>;
  addons: Record<string, boolean>;
  login: (email: string) => void;
  completeOnboarding: (input: { companyName: string; email: string; addons: Record<string, boolean> }) => void;
  toggleAddon: (addonId: string) => void;
  signOut: () => void;
  isModuleEnabled: (key: string) => boolean;
}

function readSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

const CLIENT_NAMES: Record<string, string> = {
  blu: "BluShift Logistics",
  grn: "GreenApe Mobility",
  met: "Metro Tuk Services",
  sur: "Surya Cargo Movers",
};

const CLIENT_DEFAULT_TIERS: Record<string, string> = {
  blu: "velocity",
  grn: "apex",
  met: "traction",
  sur: "velocity",
};

const TIER_DEFAULT_MODULES: Record<string, string[]> = {
  traction: ["map", "verify"],
  velocity: ["map", "geo", "ev", "safety", "verify"],
  apex: ["map", "geo", "ev", "safety", "maint", "verify"],
};

const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const clientParam = searchParams ? (searchParams.get("client") || searchParams.get("clientId")) : null;
const nameParam = searchParams ? searchParams.get("clientName") : null;
const modulesParam = searchParams ? searchParams.get("modules") : null;
const tierParam = searchParams ? searchParams.get("tier") : null;

let initialCompany = "Shastri Logistics Pvt. Ltd.";
let initialEmail = "demo@shastrilogistics.in";
let initialName = "Demo User";
let initialInitials = "DU";
let initialClient = clientParam;
let initialTier = tierParam || CLIENT_DEFAULT_TIERS[clientParam || ""] || "velocity";
let initialModulesStr = modulesParam;

if (clientParam) {
  initialCompany = CLIENT_NAMES[clientParam] || nameParam || `${clientParam.toUpperCase()} Fleet`;
  initialEmail = `ops@${initialCompany.toLowerCase().replace(/[^a-z]/g, "") || "client"}.in`;
  initialName = `${initialCompany} Admin`;
  initialInitials = initialCompany.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  try {
    sessionStorage.setItem(SESSION_CLIENT_KEY, clientParam);
    sessionStorage.setItem(SESSION_COMPANY_KEY, initialCompany);
    sessionStorage.setItem(SESSION_TIER_KEY, initialTier);
    if (modulesParam) {
      sessionStorage.setItem(SESSION_MODULES_KEY, modulesParam);
    } else {
      sessionStorage.removeItem(SESSION_MODULES_KEY);
    }
  } catch {
    // ignore
  }
} else {
  try {
    const savedClient = sessionStorage.getItem(SESSION_CLIENT_KEY);
    const savedCompany = sessionStorage.getItem(SESSION_COMPANY_KEY);
    const savedTier = sessionStorage.getItem(SESSION_TIER_KEY);
    const savedModules = sessionStorage.getItem(SESSION_MODULES_KEY);
    if (savedClient && savedCompany) {
      initialClient = savedClient;
      initialCompany = savedCompany;
      initialEmail = `ops@${savedCompany.toLowerCase().replace(/[^a-z]/g, "") || "client"}.in`;
      initialName = `${savedCompany} Admin`;
      initialInitials = savedCompany.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
    }
    if (savedTier) {
      initialTier = savedTier;
    }
    if (savedModules) {
      initialModulesStr = savedModules;
    }
  } catch {
    // ignore
  }
}

// Compute the active modules map
const defaultModules = TIER_DEFAULT_MODULES[initialTier] || ["map", "geo", "ev", "safety", "verify"];
const activeModules: Record<string, boolean> = {};
["map", "geo", "ev", "safety", "maint", "verify"].forEach((k) => {
  activeModules[k] = false;
});

if (initialModulesStr) {
  initialModulesStr.split(",").forEach((k) => {
    activeModules[k.trim()] = true;
  });
} else {
  defaultModules.forEach((k) => {
    activeModules[k] = true;
  });
}

// Add-on toggle state (used by the self-serve "Manage Add-ons" flow). For add-ons that gate an
// existing module key, derive from that module's actual state so the two stay in sync; the rest
// default to DEFAULT_ADDONS since nothing in the app currently gates on them.
const activeAddons: Record<string, boolean> = { ...DEFAULT_ADDONS };
Object.keys(ADDON_MODULE_MAP).forEach((addonId) => {
  const moduleKey = ADDON_MODULE_MAP[addonId];
  if (moduleKey) activeAddons[addonId] = !!activeModules[moduleKey];
});

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: readSession(),
  profile: {
    name: initialName,
    role: "Fleet Owner",
    email: initialEmail,
    initials: initialInitials,
    companyName: initialCompany,
  },
  clientId: initialClient,
  tier: initialTier,
  modules: activeModules,
  addons: activeAddons,
  login: (email: string) => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    set((s) => ({
      isAuthenticated: true,
      profile: email ? { ...s.profile, email } : s.profile,
    }));
  },
  completeOnboarding: ({ companyName, email, addons }) => {
    const initials = companyName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "NU";
    const fullModules: Record<string, boolean> = { map: true, geo: false, ev: false, safety: false, maint: false, verify: false };
    Object.keys(addons).forEach((addonId) => {
      const moduleKey = ADDON_MODULE_MAP[addonId];
      if (moduleKey && addons[addonId]) fullModules[moduleKey] = true;
    });
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
      sessionStorage.setItem(SESSION_COMPANY_KEY, companyName);
      sessionStorage.setItem(SESSION_TIER_KEY, "custom");
      sessionStorage.setItem(SESSION_MODULES_KEY, Object.keys(fullModules).filter((k) => fullModules[k]).join(","));
    } catch {
      // ignore
    }
    set({
      isAuthenticated: true,
      profile: { name: `${companyName} Admin`, role: "Fleet Owner", email, initials, companyName },
      tier: "custom",
      modules: fullModules,
      addons: { ...DEFAULT_ADDONS, ...addons },
    });
  },
  toggleAddon: (addonId) => {
    set((s) => {
      const nextOn = !s.addons[addonId];
      const nextAddons = { ...s.addons, [addonId]: nextOn };
      const moduleKey = ADDON_MODULE_MAP[addonId];
      const nextModules = moduleKey ? { ...s.modules, [moduleKey]: nextOn } : s.modules;
      try {
        sessionStorage.setItem(SESSION_MODULES_KEY, Object.keys(nextModules).filter((k) => nextModules[k]).join(","));
      } catch {
        // ignore
      }
      return { addons: nextAddons, modules: nextModules };
    });
  },
  signOut: () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_CLIENT_KEY);
      sessionStorage.removeItem(SESSION_COMPANY_KEY);
      sessionStorage.removeItem(SESSION_TIER_KEY);
      sessionStorage.removeItem(SESSION_MODULES_KEY);
    } catch {
      // ignore
    }
    set({ isAuthenticated: false, clientId: null, tier: null, modules: {}, addons: {} });
  },
  isModuleEnabled: (key: string) => {
    return !!get().modules[key];
  },
}));
