"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading } from "../components/shared";
import { EmptyInvitations } from "../components/empty-invitations";
import { PullToRefresh } from "./pull-to-refresh";
import { respondToInvitation } from "./browser-api";
import { LiveInvitationCard } from "./invitation-card";
import { ResponseDialog } from "./response-dialog";
import { StatusFeedback } from "./status-feedback";
import { useInvitations } from "./use-invitations";
import type { InvitationEntry } from "./types";
import "../invitations.css";
import "./presentation.css";

export function filterLiveInvitations(entries: InvitationEntry[], tab: string, search: string) {
  const query = search.trim().toLocaleLowerCase();
  return entries.filter(
    ({ request }) =>
      (tab === "pending"
        ? request.request_status === "Pending"
        : request.request_status !== "Pending") &&
      `Job #${request.job_id} ${request.job.title ?? ""} ${request.job.creator.name} ${request.job.surveys.map((survey) => survey.title).join(" ")}`
        .toLocaleLowerCase()
        .includes(query),
  );
}

export function LiveInvitationsPage({
  initial,
  referenceTime,
}: {
  initial: InvitationEntry[];
  referenceTime: string;
}) {
  const router = useRouter();
  const query = useSearchParams();
  const tab = query.get("tab") === "responded" ? "responded" : "pending";
  const state = useInvitations(initial);
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<{ id: number; mode: "accept" | "decline" } | null>(
    null,
  );
  const trigger = useRef<HTMLElement | null>(null);
  const respondedTab = useRef<HTMLButtonElement>(null);
  const pendingCount = state.entries.filter(
    ({ request }) => request.request_status === "Pending",
  ).length;
  const visible = filterLiveInvitations(state.entries, tab, search);
  function changeTab(value: string) {
    window.history.replaceState(
      null,
      "",
      `/marketer/invitations${value === "responded" ? "?tab=responded" : ""}`,
    );
    setSearch("");
  }
  async function respond(input?: Parameters<typeof respondToInvitation>[1]) {
    const selected = state.entries.find((entry) => entry.request.job_request_id === selection?.id);
    if (
      !selection ||
      state.blocked ||
      selected?.request.request_status !== "Pending" ||
      selected.request.job.job_status !== "Pending"
    )
      throw new Error(
        "This invitation is no longer available for a response. Close this dialog and refresh invitations.",
      );
    try {
      const saved = await respondToInvitation(selection.id, input);
      state.setEntries((current) =>
        current.map((entry) =>
          entry.request.job_request_id === saved.job_request_id
            ? { ...entry, request: { ...entry.request, ...saved } }
            : entry,
        ),
      );
    } catch (error) {
      return state.recover(error);
    }
    state.setNotice(
      input
        ? "Invitation declined. Your response has been saved."
        : "Invitation accepted. You can now submit your custom offer.",
    );
    changeTab("responded");
    await state.refresh(true);
  }
  return (
    <section className="ji-page ji-live">
      <PageHeading
        title="Direct Invitations"
        subtitle="Invitations sent by creators"
        backLabel="Back to overview"
        onBack={() => router.push("/marketer/dashboard")}
      />
      <StatusFeedback
        message={state.notice}
        status={state.authStatus}
        retry={state.blocked}
        pending={state.refreshing}
        onDismiss={() => state.setNotice("")}
        onRefresh={() => void state.refresh()}
      />
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList variant="line" className="ji-tabs" aria-label="Invitation status">
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger ref={respondedTab} value="responded">
            Responded ({state.entries.length - pendingCount})
          </TabsTrigger>
        </TabsList>
        <label className="ji-search">
          <span className="sr-only">Search invitations by job ID, survey title or creator</span>
          <Input
            className="ji-input"
            placeholder="Search job ID, survey title or creator"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Search size={19} aria-hidden="true" />
        </label>
        <TabsContent value={tab}>
          <PullToRefresh
            onRefresh={state.refresh}
            disabled={selection !== null || state.refreshing}
          >
            <div className="ji-grid">
              {visible.map((entry) => (
                <LiveInvitationCard
                  key={entry.request.job_request_id}
                  entry={entry}
                  referenceTime={state.refreshedAt ?? referenceTime}
                  blocked={state.blocked}
                  retrying={state.refreshing}
                  onRetry={() => void state.refresh()}
                  onRespond={(mode, element) => {
                    trigger.current = element;
                    setSelection({ id: entry.request.job_request_id, mode });
                  }}
                />
              ))}
            </div>
            {visible.length === 0 && (
              <EmptyInvitations
                tab={tab}
                searching={Boolean(search.trim())}
                onClear={() => setSearch("")}
                searchDescription="Try another job ID, survey title or creator name."
              />
            )}
          </PullToRefresh>
        </TabsContent>
      </Tabs>
      {selection && (
        <ResponseDialog
          request={
            state.entries.find((entry) => entry.request.job_request_id === selection.id)?.request
          }
          disabled={
            state.blocked ||
            state.entries.find((entry) => entry.request.job_request_id === selection.id)?.request
              .request_status !== "Pending" ||
            state.entries.find((entry) => entry.request.job_request_id === selection.id)?.request
              .job.job_status !== "Pending"
          }
          mode={selection.mode}
          onRespond={respond}
          onClose={() => setSelection(null)}
          finalFocus={() => (trigger.current?.isConnected ? trigger.current : respondedTab.current)}
        />
      )}
    </section>
  );
}
