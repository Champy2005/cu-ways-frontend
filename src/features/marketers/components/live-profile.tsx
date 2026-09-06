"use client";
import { ProfileForm } from "./profile-form";
import { liveMarketerActions } from "../browser-api";
import type { MarketerProfile } from "../types";

export function LiveProfile({ profile }: { profile: MarketerProfile }) {
  return <ProfileForm profile={profile} onSave={liveMarketerActions.saveProfile} />;
}
