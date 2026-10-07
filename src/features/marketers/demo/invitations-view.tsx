"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { InvitationsPage } from "@/features/job-invitations/components/invitations-page";
import { OfferPage } from "@/features/job-invitations/components/offer-page";
import { formatPrice } from "@/features/job-invitations/format";
import {
  demoInvitationActions,
  getSnapshot,
  getServerSnapshot,
  subscribe,
} from "@/features/job-invitations/demo/store";
import { setLocalQueries, useLocalQuery } from "../local-navigation";

export default function InvitationsView({
  view,
  requestId,
  tab,
}: {
  view: "invitations" | "offer";
  requestId?: string;
  tab?: string;
}) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const selectedId = useLocalQuery("requestId", requestId ?? "");
  const selectedTab =
    useLocalQuery("tab", tab ?? "pending") === "responded" ? "responded" : "pending";
  const [notice, setNotice] = useState<string | null>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    content.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view, selectedId]);
  function backToInvitations() {
    setLocalQueries({ view: "invitations", requestId: null, tab: "responded" });
  }
  return (
    <div ref={content}>
      {view === "offer" ? (
        <OfferPage
          key={`${selectedId}-${state.revision}`}
          request={state.invitations.find((entry) => entry.id === selectedId)}
          offer={state.offers.find((entry) => entry.requestId === selectedId)}
          actions={demoInvitationActions}
          onBack={backToInvitations}
          onSubmitted={(price) => {
            setNotice(
              `Offer submitted successfully! Your proposed price of ${formatPrice(price)} has been sent for review.`,
            );
            backToInvitations();
          }}
        />
      ) : (
        <InvitationsPage
          key={state.revision}
          invitations={state.invitations}
          offers={state.offers}
          actions={demoInvitationActions}
          tab={selectedTab}
          onTab={(value) => setLocalQueries({ tab: value })}
          onOffer={(id) => {
            setNotice(null);
            setLocalQueries({ view: "offer", requestId: id, tab: "responded" });
          }}
          onBack={() => setLocalQueries({ view: "dashboard", requestId: null, tab: null })}
          notice={notice}
          onDismissNotice={() => setNotice(null)}
        />
      )}
    </div>
  );
}
