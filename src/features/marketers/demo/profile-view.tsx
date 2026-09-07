import { ProfileWorkspace } from "../components/profile-workspace";
import { demoActions, saveDemoContact, type DemoState } from "./store";
export default function ProfileView({ state }: { state: DemoState }) {
  return (
    <ProfileWorkspace
      profile={state.profile}
      contact={state.contact}
      saveProfile={demoActions.saveProfile}
      saveContact={saveDemoContact}
    />
  );
}
