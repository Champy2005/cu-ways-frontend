"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Invitation, InvitationActions, InvitationTab, Offer } from "../types";
import { InvitationCard } from "./invitation-card";
import { RequestDialog } from "./request-dialog";
import { BriefDialog } from "./brief-dialog";
import { PageHeading } from "./shared";
import "../invitations.css";

export function filterInvitations(requests: Invitation[], tab: InvitationTab, search: string) {
  const query = search.trim().toLocaleLowerCase();
  return requests.filter(
    (request) =>
      (tab === "pending" ? request.status === "Pending" : request.status !== "Pending") &&
      `${request.job.title} ${request.creator}`.toLocaleLowerCase().includes(query),
  );
}

function EmptyInvitations({
  tab,
  searching,
  onClear,
}: {
  tab: InvitationTab;
  searching: boolean;
  onClear: () => void;
}) {
  const title = searching
    ? "No matching invitations"
    : tab === "pending"
      ? "All caught up! No pending requests"
      : "No responded invitations yet";
  const description = searching
    ? "Try another job title or creator name."
    : tab === "pending"
      ? "You don’t have any direct invitations at the moment. Keep your profile updated for future opportunities."
      : "Invitations you accept or decline will appear here.";
  return (
    <div className="ji-empty">
      <Image src="/marketer-assets/mascot.svg" width={150} height={150} alt="" />
      <h2>{title}</h2>
      <p className="ji-muted">{description}</p>
      {searching && (
        <Button variant="outline" className="ji-secondary" onClick={onClear}>
          Clear search
        </Button>
      )}
    </div>
  );
}

export function InvitationsPage({
  invitations,
  offers,
  actions,
  tab,
  onTab,
  onOffer,
  onBack,
  referenceTime,
  onNotify,
}: {
  invitations: Invitation[];
  offers: Offer[];
  actions: InvitationActions;
  tab: InvitationTab;
  onTab: (tab: InvitationTab) => void;
  onOffer: (id: string) => void;
  onBack: () => void;
  referenceTime: string;
  onNotify: (message: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<{
    request: Invitation;
    mode: "accept" | "decline";
  } | null>(null);
  const [brief, setBrief] = useState<Invitation | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const respondedTab = useRef<HTMLButtonElement>(null);
  const pendingCount = invitations.filter((entry) => entry.status === "Pending").length;
  const visible = filterInvitations(invitations, tab, search);
  function finalFocus() {
    return trigger.current?.isConnected ? trigger.current : respondedTab.current;
  }
  function responded() {
    const accepted = selection?.mode === "accept";
    setSelection(null);
    setSearch("");
    onTab("responded");
    onNotify(
      accepted
        ? "Invitation accepted. You can now submit your custom offer."
        : "Invitation declined. Your response has been saved.",
    );
  }
  return (
    <section className="ji-page">
      <PageHeading
        title="Direct Invitations"
        subtitle="Invitations sent by creators"
        onBack={onBack}
      />
      <Tabs
        value={tab}
        onValueChange={(value) => {
          onTab(value as InvitationTab);
          setSearch("");
        }}
      >
        <TabsList variant="line" className="ji-tabs" aria-label="Invitation status">
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger ref={respondedTab} value="responded">
            Responded ({invitations.length - pendingCount})
          </TabsTrigger>
        </TabsList>
        <label className="ji-search">
          <span className="sr-only">Search invitations by title or creator</span>
          <Input
            className="ji-input"
            placeholder="Search requests by title or creator"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Search size={19} aria-hidden="true" />
        </label>
        <TabsContent value={tab}>
          <div className="ji-grid">
            {visible.map((request) => (
              <InvitationCard
                key={request.id}
                request={request}
                referenceTime={referenceTime}
                offer={offers.find((entry) => entry.requestId === request.id)}
                onOffer={onOffer}
                onRespond={(entry, mode, element) => {
                  trigger.current = element;
                  setSelection({ request: entry, mode });
                }}
                onBrief={(entry, element) => {
                  trigger.current = element;
                  setBrief(entry);
                }}
              />
            ))}
          </div>
          {visible.length === 0 && (
            <EmptyInvitations
              tab={tab}
              searching={Boolean(search.trim())}
              onClear={() => setSearch("")}
            />
          )}
        </TabsContent>
      </Tabs>
      {selection && (
        <RequestDialog
          request={selection.request}
          mode={selection.mode}
          actions={actions}
          onClose={() => setSelection(null)}
          onResponded={responded}
          finalFocus={finalFocus}
        />
      )}
      {brief && (
        <BriefDialog request={brief} onClose={() => setBrief(null)} finalFocus={finalFocus} />
      )}
    </section>
  );
}
