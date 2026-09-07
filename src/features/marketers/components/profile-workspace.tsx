"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ContactProfile, SaveContact } from "@/features/users/types";
import type { MarketerProfile, ProfileInput } from "../types";
import { setLocalQuery, useLocalQuery } from "../local-navigation";
import { MarketerAvatar } from "./marketer-identity";
import { ContactForm } from "./contact-form";
import { ProfileForm } from "./profile-form";
import { RouteFeedback, type MarketerFailure } from "./route-feedback";

export interface ProfileWorkspaceProps {
  profile?: MarketerProfile;
  contact?: ContactProfile;
  professionalFailure?: MarketerFailure;
  contactFailure?: MarketerFailure;
  initialTab?: string;
  saveProfile: (input: ProfileInput) => Promise<MarketerProfile>;
  saveContact: SaveContact;
}

export function ProfileWorkspace({
  profile,
  contact,
  professionalFailure,
  contactFailure,
  initialTab = "professional",
  saveProfile,
  saveContact,
}: ProfileWorkspaceProps) {
  const query = useLocalQuery("tab", initialTab);
  const tab = query === "basic" ? "basic" : "professional";
  const name = profile?.name ?? contact?.name ?? "Your profile";
  return (
    <section>
      <div className="mk-page-heading">
        <p className="mk-eyebrow">Your professional workspace</p>
        <h1 className="mk-page-title">Profile settings</h1>
        <p className="mk-page-description">Manage your contact and professional information.</p>
      </div>
      <div className="mk-profile-layout">
        <Card className="mk-card mk-profile-summary" aria-label="Profile identity">
          <MarketerAvatar name={name} className="size-[98px] text-4xl" />
          <div className="min-w-0 max-w-full">
            <p className="text-lg font-semibold wrap-anywhere">{name}</p>
            <p className="mt-1 text-sm text-[var(--mk-info)]">Survey Marketer</p>
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
                <ProfileForm profile={profile} onSave={saveProfile} />
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
