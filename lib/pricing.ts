export const BASE_PRICE = 149;
export const ADDON_RATE = 45;
export const ADDON_MODULES = ["geo", "ev", "safety", "maint", "verify"];
export const GST_RATE = 0.18;

export function computeDeviceRate(modules: Record<string, boolean>): { addonCost: number; devRate: number } {
  const enabledAddons = ADDON_MODULES.filter((m) => modules[m]);
  const addonCost = enabledAddons.length * ADDON_RATE;
  return { addonCost, devRate: BASE_PRICE + addonCost };
}
