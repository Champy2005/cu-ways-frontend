"use client";
import { useEffect } from "react";
import { SuccessToast } from "@/components/feedback/success-toast";
export function SurveyCreatedNotice() {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("created");
    window.history.replaceState(null, "", url);
  }, []);
  return <SuccessToast message="Survey created successfully." />;
}
