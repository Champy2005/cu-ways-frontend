import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { getMyProfile, getMyStats } from "@/features/marketers/api";
import { PerformanceDashboard } from "@/features/marketers/components/performance-dashboard";
import { RouteFeedback } from "@/features/marketers/components/route-feedback";
import { isMissingMarketerProfile, marketerFailure } from "@/features/marketers/failures";
import { RefreshStats } from "@/features/marketers/components/refresh-stats";
import Link from "next/link";
import { getInvitations } from "@/features/job-invitations/live/api";
import { getHiredJobs } from "@/features/marketer-jobs/api";

export const metadata = { title: "Marketer overview | CU Ways" };

export default async function MarketerDashboardPage() {
  const session = await requireSession();
  const [profileResult, statsResult, invitationResult, jobsResult] = await Promise.allSettled([
    getMyProfile(),
    getMyStats(),
    getInvitations(),
    getHiredJobs(session.userId),
  ]);
  if (profileResult.status === "rejected") {
    // First visit as a marketer: offer account creation instead of an error.
    if (isMissingMarketerProfile(profileResult.reason)) redirect("/marketer/register");
    return <RouteFeedback kind={marketerFailure(profileResult.reason)} />;
  }
  if (statsResult.status === "rejected") {
    const kind = marketerFailure(statsResult.reason);
    if (kind !== "unavailable") return <RouteFeedback kind={kind} />;
  }
  const profile = profileResult.value;
  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
  return (
    <>
      <PerformanceDashboard
        profile={profile}
        stats={stats}
        statsError="Your performance summary is temporarily unavailable. Please try again shortly."
        workLinks={
          <>
            <h2 className="mk-section-title">Your work</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link className="mk-card mk-card-padding block" href="/marketer/invitations">
                <strong>Invitations</strong>
                <span className="mt-2 block">
                  {invitationResult.status === "fulfilled"
                    ? `${invitationResult.value.filter(({ request }) => request.request_status === "Pending" && request.job.job_status === "Pending").length} awaiting your response`
                    : "View invitations"}
                </span>
              </Link>
              <Link className="mk-card mk-card-padding block" href="/marketer/jobs">
                <strong>Your jobs</strong>
                <span className="mt-2 block">
                  {jobsResult.status === "fulfilled"
                    ? `${jobsResult.value.filter((job) => job.status === "Accepted" || job.status === "In Progress").length} active jobs`
                    : "View your jobs"}
                </span>
              </Link>
              <Link className="mk-card mk-card-padding block" href="/marketer/reviews">
                <strong>Your reviews</strong>
                <span className="mt-2 block">View ratings and feedback</span>
              </Link>
            </div>
          </>
        }
      />
      {!stats && <RefreshStats />}
    </>
  );
}
