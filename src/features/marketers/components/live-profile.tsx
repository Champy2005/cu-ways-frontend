"use client";
import { ProfileWorkspace, type ProfileWorkspaceProps } from "./profile-workspace";
import { liveMarketerActions } from "../browser-api";
import { updateCurrentUser } from "@/features/users/browser-api";
export function LiveProfile(props: Omit<ProfileWorkspaceProps, "saveProfile" | "saveContact">) {
  return (
    <ProfileWorkspace
      {...props}
      saveProfile={liveMarketerActions.saveProfile}
      saveContact={updateCurrentUser}
    />
  );
}
