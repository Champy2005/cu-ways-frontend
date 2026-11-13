import type { ReactNode } from "react";
import { JobsWorkspace } from "@/features/marketer-jobs/jobs-workspace";

export default function JobsLayout({ children }: { children: ReactNode }) {
  return <JobsWorkspace>{children}</JobsWorkspace>;
}
