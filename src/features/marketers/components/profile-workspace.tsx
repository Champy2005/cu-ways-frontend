"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ContactProfile, SaveContact } from "@/features/users/types";
import type { MarketerProfile, ProfileInput, ProfileMode } from "../types";
import { setLocalQuery, useLocalQuery } from "../local-navigation";
import { MarketerAvatar } from "./marketer-identity";
import { ContactForm } from "./contact-form";
import { ProfileForm } from "./profile-form";
import { RouteFeedback, type MarketerFailure } from "./route-feedback";

export interface ProfileWorkspaceProps {
  mode?: ProfileMode;
  profile?: MarketerProfile;
  onboarding?: boolean;
  contact?: ContactProfile;
  professionalFailure?: MarketerFailure;
  contactFailure?: MarketerFailure;
  initialTab?: string;
  saveProfile: (input: ProfileInput) => Promise<MarketerProfile>;
  saveContact: SaveContact;
}

function headingDescription(creating: boolean, created: boolean, onboarding: boolean) {
  if (creating) {
    return "Tell creators about your experience and availability, then create your marketer account.";
  }
  return onboarding && !created
    ? "Complete your professional information to create your marketer profile."
    : "Manage your contact and professional information.";
}

function ProfileHeading({
  creating,
  created,
  onboarding,
}: {
  creating: boolean;
  created: boolean;
  onboarding: boolean;
}) {
  return (
    <div className="mk-page-heading">
      <p className="mk-eyebrow">{creating ? "Become a marketer" : "Your professional workspace"}</p>
      <h1 className="mk-page-title">{creating ? "Create marketer account" : "Profile settings"}</h1>
      <p className="mk-page-description">{headingDescription(creating, created, onboarding)}</p>
    </div>
  );
}

export function ProfileWorkspace({
  mode = "settings",
  profile,
  onboarding = false,
  contact,
  professionalFailure,
  contactFailure,
  initialTab = "professional",
  saveProfile,
  saveContact,
}: ProfileWorkspaceProps) {
  const router = useRouter();
  const [created, setCreated] = useState(false);
  const query = useLocalQuery("tab", initialTab);
  const tab = query === "basic" ? "basic" : "professional";
  const name = profile?.name ?? contact?.name ?? "Your profile";
  const creating = mode === "create";
  return (
    <section>
      <ProfileHeading creating={creating} created={created} onboarding={onboarding} />
      <div className="mk-profile-layout">
        <Card className="mk-card mk-profile-summary" aria-label="Profile identity">
          <MarketerAvatar name={name} className="size-[98px] text-4xl" />
          <div className="min-w-0 max-w-full">
            <p className="text-lg font-semibold wrap-anywhere">{name}</p>
            <p className="mt-1 text-sm text-[var(--mk-secondary)]">Survey Marketer</p>
          </div>
          <p className="mk-profile-summary-description border-t border-[var(--mk-border)] pt-5 text-sm leading-6 text-[var(--mk-muted)]">
            Help creators get to know your experience and when you are available to work.
          </p>
        </Card>
        <Card className="mk-card mk-profile-editor">
          <Tabs value={tab} onValueChange={(value) => setLocalQuery("tab", String(value))}>
            <TabsList variant="line" className="mk-profile-tabs" aria-label="Profile information">
              <TabsTrigger value="basic">Basic information</TabsTrigger>
              <TabsTrigger value="professional">In-depth information</TabsTrigger>
            </TabsList>
            {/* Keep both controllers mounted: switching tabs never clears an unsaved draft. */}
            <TabsContent value="basic" keepMounted>
              {contact ? (
                <ContactForm contact={contact} onSave={saveContact} />
              ) : (
                <RouteFeedback kind={contactFailure} />
              )}
            </TabsContent>
            <TabsContent value="professional" keepMounted>
              {profile ? (
                <ProfileForm
                  mode={creating ? "create" : "settings"}
                  profile={profile}
                  onSave={saveProfile}
                  onProfileChange={() => {
                    setCreated(true);
                    // A new marketer continues straight into their workspace.
                    if (creating) router.push("/marketer/dashboard");
                  }}
                />
              ) : (
                <RouteFeedback kind={professionalFailure} />
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </section>
  );
}
