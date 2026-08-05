export { delay, notImplemented } from "@navyug/core";

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
