import { create } from "zustand";
import { createToastSlice, type ToastSlice } from "@navyug/core";

interface UiState extends ToastSlice {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set, get, api) => ({
  ...createToastSlice(set, get, api),
  sidebarOpen: false,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}));
