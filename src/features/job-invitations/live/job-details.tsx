import { ArrowUpRight, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "../format";
import type { ReceivedRequest } from "./types";
import { safeExternalUrl } from "./validation";

function ExternalLink({
  url,
  children,
  brief = false,
}: {
  url: string;
  children: React.ReactNode;
  brief?: boolean;
}) {
  const safe = safeExternalUrl(url);
  return safe ? (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={brief ? "Open project brief" : undefined}
      className={
        brief
          ? cn(buttonVariants({ variant: "ghost" }), "ji-brief ji-accent")
          : "ji-accent inline-flex items-center gap-1 underline underline-offset-4"
      }
    >
      {brief && <FileText size={15} aria-hidden="true" />}
      {children}
      <ArrowUpRight size={14} aria-hidden="true" />
    </a>
  ) : (
    <span>Link unavailable</span>
  );
}

function ProjectBrief({ request, short = false }: { request: ReceivedRequest; short?: boolean }) {
  return request.job.brief ? (
    <ExternalLink url={request.job.brief.url} brief>
      {short ? "Open brief" : "Open project brief"}
    </ExternalLink>
  ) : (
    <p className="ji-muted ji-live-no-brief">No brief attached</p>
  );
}

export function JobDetails({
  request,
  compact = false,
}: {
  request: ReceivedRequest;
  compact?: boolean;
}) {
  const job = request.job;
  return (
    <div>
      <div className="ji-tags" aria-label="Job deadline and target">
        <span>Deadline: {job.deadline ? formatDate(job.deadline) : "Not specified"}</span>
        <span>
          Target:{" "}
          {job.target_responses === null ? "Not specified" : `${job.target_responses} responses`}
        </span>
      </div>
      {job.description && (
        <p className="mt-3 text-sm whitespace-pre-wrap break-words">{job.description}</p>
      )}
      {job.budget && <p className="mt-2 text-sm ji-muted">Compensation: ฿{job.budget}</p>}
      {!compact && (
        <p className="ji-surveys ji-live-survey-overview">
          {job.surveys.length} {job.surveys.length === 1 ? "survey" : "surveys"} attached
          {job.surveys.length > 1 && ` (${job.surveys.map((survey) => survey.title).join(", ")})`}
        </p>
      )}
      <div className={compact ? undefined : "ji-live-detail-links"}>
        <details className="ji-live-details">
          <summary>{compact ? "View project details" : "View survey details"}</summary>
          <ul className="ji-live-survey-list" aria-label="Linked surveys">
            {job.surveys.map((survey) => (
              <li key={survey.survey_id}>
                <h3 className="font-semibold break-words">{survey.title}</h3>
                <p className="ji-message">{survey.description || "Description: Not specified"}</p>
                <dl className="ji-live-survey-meta">
                  <div>
                    <dt>Target group</dt>
                    <dd>{survey.target_group || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt>Desired responses</dt>
                    <dd>{survey.desired_responses ?? "Not specified"}</dd>
                  </div>
                  <div>
                    <dt>Survey deadline</dt>
                    <dd>{survey.deadline ? formatDate(survey.deadline) : "Not specified"}</dd>
                  </div>
                </dl>
                <ExternalLink url={survey.survey_link}>Open survey</ExternalLink>
              </li>
            ))}
          </ul>
          {compact && <ProjectBrief request={request} />}
        </details>
        {!compact && <ProjectBrief request={request} short />}
      </div>
    </div>
  );
}
