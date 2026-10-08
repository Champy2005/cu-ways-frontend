"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NotificationToast } from "@/features/job-invitations/components/notification-toast";
import { DEMO_NOW } from "@/features/job-invitations/demo/fixtures";
import {
  createNotification,
  type FeatureNotification,
} from "@/features/job-invitations/notifications";
import { InvitationsPage } from "@/features/job-invitations/components/invitations-page";
import { OfferPage } from "@/features/job-invitations/components/offer-page";
import { bangkokDate, formatPrice } from "@/features/job-invitations/format";
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
  const [notice, setNotice] = useState<FeatureNotification | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);
  function notify(message: string) {
    setNotice(createNotification(message, "success"));
  }
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
      <NotificationToast notification={notice} onDismiss={dismissNotice} />
      {view === "offer" ? (
        <OfferPage
          key={`${selectedId}-${state.revision}`}
          request={state.invitations.find((entry) => entry.id === selectedId)}
          offer={state.offers.find((entry) => entry.requestId === selectedId)}
          actions={demoInvitationActions}
          minimumDate={bangkokDate(DEMO_NOW)}
          onBack={backToInvitations}
          onSubmitted={(price) => {
            notify(
              `Offer submitted successfully! Your proposed price of ${formatPrice(price)} has been sent for review.`,
            );
            backToInvitations();
          }}
          onWithdrawn={() => {
            notify(
              "Offer withdrawn successfully. You cannot submit another offer for this invitation.",
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
          referenceTime={DEMO_NOW}
          onNotify={notify}
        />
      )}
    </div>
  );
}
