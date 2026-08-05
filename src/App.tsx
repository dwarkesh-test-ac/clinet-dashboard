import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { routes } from "./config/routes";
import { ProtectedRoute } from "./layouts/ProtectedRoute";
import { AppShell } from "./layouts/AppShell";
import { LoginPage } from "./pages/LoginPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const LiveMapPage = lazy(() => import("./pages/LiveMapPage").then((m) => ({ default: m.LiveMapPage })));
const TrackingPage = lazy(() => import("./pages/TrackingPage").then((m) => ({ default: m.TrackingPage })));
const TripHistoryPage = lazy(() => import("./pages/TripHistoryPage").then((m) => ({ default: m.TripHistoryPage })));
const FuelLogPage = lazy(() => import("./pages/FuelLogPage").then((m) => ({ default: m.FuelLogPage })));
const TimelinePage = lazy(() => import("./pages/TimelinePage").then((m) => ({ default: m.TimelinePage })));
const StatsPage = lazy(() => import("./pages/StatsPage").then((m) => ({ default: m.StatsPage })));
const EventsPage = lazy(() => import("./pages/EventsPage").then((m) => ({ default: m.EventsPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const ReportResultsPage = lazy(() => import("./pages/ReportResultsPage").then((m) => ({ default: m.ReportResultsPage })));
const InsurancePage = lazy(() => import("./pages/InsurancePage").then((m) => ({ default: m.InsurancePage })));
const FinancialsPage = lazy(() => import("./pages/FinancialsPage").then((m) => ({ default: m.FinancialsPage })));
const DriversPage = lazy(() => import("./pages/DriversPage").then((m) => ({ default: m.DriversPage })));
const GeofencePage = lazy(() => import("./pages/GeofencePage").then((m) => ({ default: m.GeofencePage })));
const GroupsPage = lazy(() => import("./pages/GroupsPage").then((m) => ({ default: m.GroupsPage })));
const AddDevicePage = lazy(() => import("./pages/AddDevicePage").then((m) => ({ default: m.AddDevicePage })));
const DevicesPage = lazy(() => import("./pages/DevicesPage").then((m) => ({ default: m.DevicesPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage").then((m) => ({ default: m.SubscriptionPage })));
const BillingPage = lazy(() => import("./pages/BillingPage").then((m) => ({ default: m.BillingPage })));
const CancelPlanPage = lazy(() => import("./pages/CancelPlanPage").then((m) => ({ default: m.CancelPlanPage })));
const UsersPage = lazy(() => import("./pages/UsersPage").then((m) => ({ default: m.UsersPage })));

// Route-level code splitting is handled by AppShell, which wraps its <Outlet /> in a single
// Suspense boundary with a fade transition — see layouts/AppShell.tsx. Don't add another
// Suspense here; it would sit outside AppShell and never actually catch the lazy pages'
// loading state (AppShell's boundary is the nearest ancestor and wins).
export function App() {
  return (
    <Routes>
      <Route path={routes.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path={routes.dashboard} element={<DashboardPage />} />
          <Route path={routes.liveMap} element={<LiveMapPage />} />
          <Route path={routes.tracking()} element={<TrackingPage />} />
          <Route path={routes.tripHistory()} element={<TripHistoryPage />} />
          <Route path={routes.fuelLog} element={<FuelLogPage />} />
          <Route path={routes.timeline} element={<TimelinePage />} />
          <Route path={routes.stats} element={<StatsPage />} />
          <Route path={routes.events} element={<EventsPage />} />
          <Route path={routes.reports} element={<ReportsPage />} />
          <Route path={routes.reportResults} element={<ReportResultsPage />} />
          <Route path={routes.insurance} element={<InsurancePage />} />
          <Route path={routes.financials} element={<FinancialsPage />} />
          <Route path={routes.drivers} element={<DriversPage />} />
          <Route path={routes.geofences} element={<GeofencePage />} />
          <Route path={routes.groups} element={<GroupsPage />} />
          <Route path={routes.addDevice} element={<AddDevicePage />} />
          <Route path={routes.devices} element={<DevicesPage />} />
          <Route path={routes.profile} element={<ProfilePage />} />
          <Route path={routes.subscription} element={<SubscriptionPage />} />
          <Route path={routes.billing} element={<BillingPage />} />
          <Route path={routes.cancelPlan} element={<CancelPlanPage />} />
          <Route path={routes.users} element={<UsersPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to={routes.dashboard} replace />} />
      <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
    </Routes>
  );
}
