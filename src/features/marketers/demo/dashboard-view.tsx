import { PerformanceDashboard, type RecentJob } from "../components/performance-dashboard";
import type { DemoState } from "./store";
const recentJobs: RecentJob[] = [
  { id: 1, title: "Campus Food Survey", date: "2026-09-02", status: "Completed", price: "250.00" },
  {
    id: 2,
    title: "Student Travel Habits",
    date: "2026-09-04",
    status: "In Progress",
    price: "400.00",
  },
];

export default function DashboardView({ state }: { state: DemoState }) {
  return (
    <PerformanceDashboard profile={state.profile} stats={state.stats} recentJobs={recentJobs} />
  );
}
